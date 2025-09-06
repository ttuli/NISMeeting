import { ElMessage } from "element-plus";

async function getScreenStream(openVideo: boolean, openAudio: boolean) {
    let microStream = null;
    let systemStream = null;
    
    if (openAudio) {
        try {
            microStream = await navigator.mediaDevices.getUserMedia({
                audio: true
            });
            microStreamId = microStream.id
        } catch (audioError) {
            console.warn('无法获取麦克风:', audioError);
            ElMessage.warning("无法获取麦克风权限，将只共享屏幕画面");
        }
    }
    if (openVideo) {
        try {
            systemStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: window.screen.width,
                    height: window.screen.height,
                    frameRate: { ideal: 40 },
                },
                audio:true
            });
            systemStreamId = systemStream.id
        } catch (error) {
            console.error('获取屏幕流失败:', error);
            console.dir(error)
            ElMessage.error("无法获取屏幕共享权限，请重试");
            throw error;
        }
    }
    const combinedStream = new MediaStream();

    if (systemStream) {
        systemStream.getTracks().forEach(track => {
            combinedStream.addTrack(track);
        });
    }

    if (microStream) {
        microStream.getTracks().forEach(track => {
            combinedStream.addTrack(track);
        });
    }

    return combinedStream
}


const pc = new window.RTCPeerConnection({
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
})
const dc = pc.createDataChannel("msg");

let meetingId = ""
let userId = ""
let stream: MediaStream | null = null;
let systemStreamId: string = ''
let microStreamId: string = ''
let vi :HTMLVideoElement  | null = null;

let candidateQueue: RTCIceCandidateInit[] = [];
let remoteSet = false;

function play (stream: MediaStream) {
    console.log(stream);
    if (vi) {
        vi.srcObject = stream;
        vi.onloadedmetadata = () => {
            vi?.play()
        }
    }
}

dc.onopen = () => {
    console.log('datachannel open')
}
dc.onerror = (err) => {
    console.log('datachannel error:'+err)
}
dc.onmessage = (event) => {

}

pc.onicegatheringstatechange = function() {
    console.log('ICE gathering state:', pc.iceGatheringState);
};

pc.onconnectionstatechange = function() {
    console.log("Connection state:", pc.connectionState);

    switch (pc.connectionState) {
        case "connected":
            console.log("PeerConnection 已连接");
            break;
        case "disconnected":
        case "failed":
            console.log("PeerConnection 断开或连接失败");
            ElMessage.error("与服务器断开连接，请重新进入")
            remoteSet = false;
            break;
        case "closed":
            console.log("PeerConnection 已关闭");
            break;
    }
}

pc.onicecandidate = function (e) {
    if (e.candidate) {
        const candidate = e.candidate.toJSON()
        window.ipcRenderer.send('ws-send',{
            type:'candidate',
            data:{
                meetingId,
                userId,
                candidate,
            }
        })
    }
}

pc.ontrack = (event) => {
    console.dir(event)
    if (event.streams && event.streams[0] && vi) {
        play(event.streams[0]);
    } else {
        const stream = new MediaStream([event.track]);
        play(stream);
    }
}

function RegisterListener() {
    window.ipcRenderer.on('answer',(event,data) => {
        pc.setRemoteDescription({
            type: data.type, // "answer"
            sdp: data.sdp
          }).then(() => {
            remoteSet = true;
            candidateQueue.forEach((c) => {
                pc.addIceCandidate(c).catch(err => {
                    console.log("candidate cache:"+err)
                })
            });
            candidateQueue = []
        }).catch(err => {
            console.log("setRemoteDescription error",err)
        });
    })
    window.ipcRenderer.on('candidate',(event,data) => {
        console.log('candidate')
        if (remoteSet) {
            pc.addIceCandidate(data.candidate).catch(err => {
                console.log("addIceCandidate error",err)
            });
        } else {
            candidateQueue.push(data.candidate);
        }
    })
    window.ipcRenderer.on('offer',(event,data) => {
        pc.setRemoteDescription({
            type:"offer",
            sdp:data.sdp
        }).then(async () => {
            remoteSet = true;
            candidateQueue.forEach((c) => {
                pc.addIceCandidate(c).catch(err => {
                    console.log("candidate cache:"+err)
                })
            });
            candidateQueue = []
            let ans = await pc.createAnswer()
            await pc.setLocalDescription(ans)

            window.ipcRenderer.send('ws-send', {
            type: 'answer',
            data: {
                meetingId,
                userId,
                sdp: pc.localDescription?.sdp,
                type: pc.localDescription?.type
            }
        });
        }).catch(err => {
            ElMessage.error("连接错误")
            console.log("setRemoteDescription error",err)
        });
    })
}

function RemoveAllListener() {
    window.ipcRenderer.removeAllListeners('answer')
    window.ipcRenderer.removeAllListeners('candidate')
    window.ipcRenderer.removeAllListeners('offer')
    pc.close()
}

function RegisterInfo(mid: string, uid: string) {
    meetingId = mid
    userId = uid
    vi = document.getElementById("screenVideo") as HTMLVideoElement | null;
}

async function createOffer(openVideo: boolean, openAudio: boolean) {
    try {
        stream = await getScreenStream(openVideo,openAudio);
        
        stream.getTracks().forEach(track => {
            if (track.id === systemStreamId) {
                console.log("systemstream")
                track.enabled = openVideo
            }
            if (track.id === microStreamId) {
                console.log("microstream")
                track.enabled = openAudio
            }
        });

        stream?.getTracks().forEach(track => pc.addTrack(track, stream as MediaStream));
        
        const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
        });
        
        await pc.setLocalDescription(offer);
        
        window.ipcRenderer.send('ws-send', {
            type: 'offer',
            data: {
                meetingId,
                userId,
                sdp: pc.localDescription?.sdp,
                type: pc.localDescription?.type
            }
        });
        
    } catch (error) {
        console.error('创建 offer 失败:', error);
        ElMessage.error("创建连接失败，请稍后重试");
    }
}

RegisterListener()

function UpdateState(openVideo : boolean,openAudio : boolean) {
    stream?.getTracks().forEach(track => {
        if (track.id === systemStreamId) {
            console.log("systemstream")
            track.enabled = openVideo
        }
        if (track.id === microStreamId) {
            console.log("microstream")
            track.enabled = openAudio
        }
    });
}

function SendMesage(data : string) {
    dc.send(data)
}

export {
    createOffer,
    RegisterInfo,
    UpdateState,
    RemoveAllListener,
    SendMesage
}
