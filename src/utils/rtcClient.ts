const pc = new window.RTCPeerConnection({})

pc.onconnectionstatechange = function() {
    console.log('RTC state change')
}

async function createOffer(meetingId: string, userId: string) {
    const offer = await pc.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: true
    })
    await pc.setLocalDescription(offer)
    window.ipcRenderer.send('ws-send',{
        type: 'offer',
        data:{
            meetingId,
            userId,
            sdp: offer.sdp,
            sdpType: offer.type
        }
    })
}

export {
    createOffer
}
