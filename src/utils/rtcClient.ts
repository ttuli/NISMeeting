import { ElMessage } from "element-plus";

async function getScreenStream() {
    let microStream = null;
    let systemStream = null;
    
    try {
        microStream = await navigator.mediaDevices.getUserMedia({
            audio: true
        });
    } catch (audioError) {
        console.warn('无法获取麦克风:', audioError);
        ElMessage.warning("无法获取麦克风权限，将只共享屏幕画面");
    }
    try {
        systemStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                width: window.screen.width,
                height: window.screen.height,
                frameRate: { ideal: 40 },
            },
            audio:true
        });
    } catch (error) {
        console.error('获取屏幕流失败:', error);
        console.dir(error)
        ElMessage.error("无法获取屏幕共享权限，请重试");
        throw error;
    }
    const combinedStream = new MediaStream();

    if (systemStream) {
        let hasAudio = false;
        let hasVideo = false;
        systemStream.getTracks().forEach(track => {
            if (track.kind === 'audio') {
                if (!hasAudio) {
                    hasAudio = true
                    systemAudioId = track.id
                    combinedStream.addTrack(track);
                }
            } else if (track.kind === 'video') {
                if (!hasVideo) {
                    hasVideo = true
                    systemVideoId = track.id
                    combinedStream.addTrack(track);
                }
            }
        });
    }

    if (microStream && microStream.getTracks().length !== 0) {
        const track = microStream.getTracks()[0]
        microAudioId = track.id
        combinedStream.addTrack(track);
    }

    return combinedStream
}


const pc = new window.RTCPeerConnection({
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
})
const dc = pc.createDataChannel("msg");

let meetingId = ""
let userId = ""
let systemVideoId : string = ""
let systemAudioId : string = ""
let microAudioId : string = ""
let playStream: MediaStream = new MediaStream()
let vi :HTMLVideoElement  | null = null;

let candidateQueue: RTCIceCandidateInit[] = [];
let remoteSet = false;

function play () {
    if (vi) {
        vi.srcObject = playStream;
        vi.onloadedmetadata = () => {
            if (vi) {
                vi.muted=false
                vi.play().catch(err => console.error("play error", err));
            }
            
        };
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
    // event
    // if (event.track.kind==='video') {
    //     if (event.streams && event.streams[0]) {
    //         play();
    //     } else {
    //         const stream = new MediaStream([event.track]);
    //         play();
    //     }
    // } else {
    //     console.log(event.track.kind)
    // }
    event.streams[0].getTracks().forEach(track => {
        playStream.addTrack(track);
    });
    play()
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

async function RegisterInfo(mid: string, uid: string,openVideo: boolean, openAudio: boolean) {
    await initPc(openVideo,openAudio)
    meetingId = mid
    userId = uid
    vi = document.getElementById("screenVideo") as HTMLVideoElement | null;
    window.ipcRenderer.send("ws-send",{
        type:'needOffer',
        meetingId:mid
    })
}

async function initPc(openVideo: boolean, openAudio: boolean) {
    console.log(openAudio,openVideo)
    let res=await getScreenStream()
    res.getTracks().forEach(track => {
        if (track.id == systemAudioId || track.id === systemVideoId) {
            track.enabled=openVideo
        } else {
            track.enabled=openAudio
        }
        pc.addTrack(track)
    })
}

async function UpdateState(openVideo: boolean, openAudio: boolean) {
    pc.getSenders().forEach(sender => {
        if (sender.track?.id == systemAudioId || sender.track?.id === systemVideoId) {
            sender.track.enabled=openVideo
        } else if(sender.track) {
            sender.track.enabled=openAudio
        }
    })
    
    return true
}

// async function createOffer(openVideo: boolean, openAudio: boolean) {
//     try {
//         finalStream = await getScreenStream(openVideo,openAudio);
        
//         // finalStream.getTracks().forEach(track => {
//         //     if (track.id === systemStreamId) {
//         //         console.log("systemstream")
//         //         track.enabled = openVideo
//         //     }
//         //     if (track.id === microStreamId) {
//         //         console.log("microstream")
//         //         track.enabled = openAudio
//         //     }
//         // });

//         finalStream?.getTracks().forEach(track => pc.addTrack(track, finalStream as MediaStream));
        
//         const offer = await pc.createOffer({
//             offerToReceiveAudio: true,
//             offerToReceiveVideo: true
//         });
        
//         await pc.setLocalDescription(offer);
        
//         window.ipcRenderer.send('ws-send', {
//             type: 'offer',
//             data: {
//                 meetingId,
//                 userId,
//                 sdp: pc.localDescription?.sdp,
//                 type: pc.localDescription?.type
//             }
//         });
        
//     } catch (error) {
//         console.error('创建 offer 失败:', error);
//         ElMessage.error("创建连接失败，请稍后重试");
//     }
// }

RegisterListener()

function SendMesage(data : string) {
    dc.send(data)
}

function Close() {
    pc.close()
}

export {
    RegisterInfo,
    UpdateState,
    RemoveAllListener,
    SendMesage,
    Close
}
