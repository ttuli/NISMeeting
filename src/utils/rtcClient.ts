
const pc = new window.RTCPeerConnection({})

pc.onconnectionstatechange = function() {
    console.log('RTC state change')
}

async function createWebRTC() {
    const offer = await pc.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: true
    })
    await pc.setLocalDescription(offer)
    return pc.localDescription
}