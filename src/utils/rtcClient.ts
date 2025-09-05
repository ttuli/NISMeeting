import { ElMessage } from "element-plus";

async function getScreenStream() {
    let microStream = null;
    
    // 尝试获取麦克风音频（可选）
    try {
        microStream = await navigator.mediaDevices.getUserMedia({
            audio: true
        });
    } catch (audioError) {
        console.warn('无法获取麦克风:', audioError);
        ElMessage.warning("无法获取麦克风权限，将只共享屏幕画面");
    }

    try {
        let screenStream;
        try {
            screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: window.screen.width,
                    height: window.screen.height,
                    frameRate: { ideal: 40 },
                },
                audio:true
            });
            console.log('成功获取屏幕流和系统音频');
        } catch (systemAudioError) {
            console.warn('无法获取系统音频，降级为仅屏幕视频:', systemAudioError);
            console.dir(systemAudioError)
            screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: window.screen.width,
                    height: window.screen.height,
                    frameRate: { ideal: 40 },
                },
                audio: false
            });
        }

        const audioCtx = new AudioContext();
        const destination = audioCtx.createMediaStreamDestination();

        if (screenStream.getAudioTracks().length > 0) {
            const sysAudio = new MediaStream([screenStream.getAudioTracks()[0]]);
            audioCtx.createMediaStreamSource(sysAudio).connect(destination);
        }
        if (microStream && microStream.getAudioTracks().length > 0) {
            const micAudio = new MediaStream([microStream.getAudioTracks()[0]]);
            audioCtx.createMediaStreamSource(micAudio).connect(destination);
        }

        const finalStream = new MediaStream();

        screenStream.getVideoTracks().forEach(track => {
            finalStream.addTrack(track);
        });

        destination.stream.getAudioTracks().forEach(track => {
            finalStream.addTrack(track);
        });

        console.log(finalStream.getVideoTracks())
        console.log(finalStream.getAudioTracks())
        console.log(finalStream.active)

        return finalStream;
        
    } catch (error) {
        console.error('获取屏幕流失败:', error);
        console.dir(error)
        ElMessage.error("无法获取屏幕共享权限，请重试");
        throw error;
    }
}

const pc = new window.RTCPeerConnection({
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
})
let meetingId = ""
let userId = ""
let stream: MediaStream | null = null;
let vi :HTMLVideoElement  | null = null;

let candidateQueue: RTCIceCandidateInit[] = [];
let remoteSet = false;

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
        console.log("candidate")
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
    if (event.streams && event.streams[0] && vi) {
    vi.srcObject = event.streams[0];
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
        if (remoteSet) {
            pc.addIceCandidate(data.candidate).catch(err => {
                console.log("addIceCandidate error",err)
            });
        } else {
            candidateQueue.push(data.candidate);
        }
    })
}

function RemoveAllListener() {
    window.ipcRenderer.removeAllListeners('answer')
    window.ipcRenderer.removeAllListeners('candidate')
    pc.close()
}

function RegisterInfo(mid: string, uid: string) {
    meetingId = mid
    userId = uid
    vi = document.getElementById("screenVideo") as HTMLVideoElement | null;
}

async function createOffer(openVideo: boolean, openAudio: boolean) {
    try {
        // stream = await getScreenStream();
        // if (!stream) {
        //     ElMessage.error("获取音频失败，请稍后重试");
        //     return;
        // }
        
        // stream.getVideoTracks().forEach(track => track.enabled = openVideo);
        // stream.getAudioTracks().forEach(track => {
        //     track.enabled = openAudio;
        // });
        
        // stream.getTracks().forEach(track => pc.addTrack(track, stream as MediaStream));
        
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
                sdpType: pc.localDescription?.type
            }
        });
        
    } catch (error) {
        console.error('创建 offer 失败:', error);
        ElMessage.error("创建连接失败，请稍后重试");
    }
}

RegisterListener()

function UpdateState(openVideo : boolean,openAudio : boolean) {
    if(stream) {
        stream.getVideoTracks().forEach(track => track.enabled = openVideo);
        stream.getAudioTracks().forEach(track => {
            track.enabled = openAudio
        })
    }
}

export {
    createOffer,
    RegisterInfo,
    UpdateState,
    RemoveAllListener
}
