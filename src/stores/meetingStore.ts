import { LocalAudioTrack, LocalTrack, LocalVideoTrack, RemoteTrack, Track } from "livekit-client";
import { defineStore } from "pinia";
import { nextTick, reactive } from "vue";

interface AudioSource {
  id: string
  muted: boolean
}

interface Participant {
  id: string
  name: string
  hasVideo: boolean
  audioStream: AudioSource[]
}

interface MemberInfo {
    uid : string;
    name : string;
    micOn : boolean;
}

interface MeetingInfo {
  description: string;
  hostId: string;
  hostName: string;
  meetingId: string;
  meetingName: string;
  meetingPassword: string;
  startTime:number;
}

export const useMeetingStore = defineStore('meetingStore',{
    state: () => ({
        participants: reactive<Participant[]>([]),
        members: reactive<MemberInfo[]>([]),
        meeting: reactive<MeetingInfo>({
            meetingId: '',
            meetingName: '',
            description: '',
            hostId: '',
            meetingPassword: '',
            hostName:'',
            startTime: 0
        }),
        track2Id:new Map<string, string>(),
    }),
    actions: {
      addAudioTrack(id: string,name: string,track: LocalAudioTrack | RemoteTrack) {
        console.log("enter addAudioTrack")
        let isIn = false;
        const uid = crypto.randomUUID()
        const sid = track.sid
        this.participants.forEach(item => {
          if(item.id===id){
            isIn=true
            item.audioStream.push({
              id:uid,
              muted:false
            })
            nextTick(() => {
              const el = document.getElementById(uid) as HTMLMediaElement
              console.log("add sid",sid)
              if (el) {
                if (sid) {
                  this.track2Id.set(sid,uid)
                  console.log(sid,uid)
                } else {
                  console.log('set sid null')
                }
                // el.volume = 1
                track.attach(el)
              }
            })
          }
        })
        if (!isIn) {
          this.participants.push({
            id:id,
            name:name,
            hasVideo: false,
            audioStream: [
              {
                id:uid,
                muted:false,
              }
            ]
          })
          nextTick(() => {
            const el = document.getElementById(uid) as HTMLMediaElement
            console.log("add sid",sid)
            if (el) {
              if (sid) {
                this.track2Id.set(sid,uid)
                console.log(sid,uid)
              } else {
                console.log('set sid null')
              }
              el.volume = 1
              track.attach(el)
            }
          })
        }
        
        if(track.source === Track.Source.Microphone) {
          let l = this.members.filter(item => item.uid === id)
          if (l.length)
            l[0].micOn = !track.isMuted
        }
      },
      addVideoTrack(id: string,name: string,track: LocalVideoTrack | RemoteTrack) {
        console.log("enter addVideoTrack")
        let isIn = false;
        this.participants.forEach(item => {
          if(item.id===id){
            isIn=true
            item.hasVideo = true
            return
          }
        })
        if (!isIn) {
          this.participants.push({
            id:id,
            name:name,
            hasVideo: true,
            audioStream:[]
          })
        }
        nextTick(() => {
          const el = document.getElementById('video-'+id) as HTMLMediaElement
          if(el)
            track.attach(el)
        })
      },
      removeTrack(id : string,track: RemoteTrack ) {
        let list = this.participants.filter(item => item.id === id)
        if (list.length === 0) return 
        console.log("removeTrack")
        console.log(track.kind)
        console.log(track.kind === Track.Kind.Video)
        console.log("removeTrack")
        if(track.kind === Track.Kind.Video) {
          list[0].hasVideo = false;
        } else if(track.kind === Track.Kind.Audio) {
          if(track.source === Track.Source.Microphone) {
              let l = this.members.filter(item => item.uid === id)
              if (l.length)
                l[0].micOn = false
          }
          const sid = track.sid
          if(sid) {
            console.log("sid not null")
            const aid = this.track2Id.get(sid)
            console.log(aid,track.sid)
            list[0].audioStream=list[0].audioStream.filter(a => a.id!==aid)
          } else {
            console.log("sid null")
          }
        }
        console.log(list[0].audioStream.length)
        if(!list[0].hasVideo&&!list[0].audioStream.length) {
          list = []
          this.participants=this.participants.filter(item => {
            console.log(item.id,id)
            return item.id !== id
          })
        }
      },
      cleanAll() {
        this.members = []
        this.participants = []
      }
    }
})