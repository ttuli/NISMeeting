const pc = new window.RTCPeerConnection({})
let meetingId = ""
let userId = ""

let candidateQueue: RTCIceCandidateInit[] = [];
let remoteSet = false;

pc.onconnectionstatechange = function() {
    console.log("Connection state:", pc.connectionState);

    switch (pc.connectionState) {
        case "connected":
            console.log("PeerConnection 已连接");
            break;
        case "disconnected":
        case "failed":
            console.log("PeerConnection 断开或连接失败");
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

function RegisterListener() {
    window.ipcRenderer.on('answer',(event,data) => {
        console.dir("answer")
        console.dir(data)
        pc.setRemoteDescription({
            type: data.type, // "answer"
            sdp: data.sdp
          }).then(() => {
            remoteSet = true;
            candidateQueue.forEach(async (c) => {
                try {
                    await pc.addIceCandidate(c)
                } catch(err) {
                    console.log("candidate cache:"+err)
                }
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
}

function RegisterInfo(mid: string, uid: string) {
    meetingId = mid
    userId = uid
}

async function createOffer() {
    const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
    })
    await pc.setLocalDescription(offer)
    window.ipcRenderer.send('ws-send',{
        type: 'offer',
        data:{
            meetingId,
            userId,
            sdp: pc.localDescription?.sdp,
            sdpType: pc.localDescription?.type
        }
    })
}

RegisterListener()

export {
    createOffer,
    RegisterInfo,
    RemoveAllListener
}
