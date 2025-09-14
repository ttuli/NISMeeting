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
        })
    }),
    actions: {
      addAudioTrack(id: string,name: string,track: LocalAudioTrack | RemoteTrack) {
        let isIn = false;
        const uid = crypto.randomUUID()
        this.participants.forEach(item => {
          if(item.id===id){
            isIn=true
            item.audioStream.push({
              id:uid,
              muted:false
            })
            nextTick(() => {
              const el = document.getElementById(uid) as HTMLMediaElement
              if (el)
                track.attach(el)
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
        }
        nextTick(() => {
          const el = document.getElementById(uid) as HTMLMediaElement
          if(el)
            track.attach(el)
        })
        if(track.source === Track.Source.Microphone) {
          let l = this.members.filter(item => item.uid === id)
          if (l.length)
            l[0].micOn = true
        }
      },
      addVideoTrack(id: string,name: string,track: LocalVideoTrack | RemoteTrack) {
        let isIn = false;
        this.participants.forEach(item => {
          if(item.id===id){
            isIn=true
            item.hasVideo = true
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
      removeTrack(id : string,track: RemoteTrack | LocalTrack) {
        let list = this.participants.filter(item => item.id === id)
        if (list.length === 0) return  
        track.detach().forEach(item => {
          if(track.kind === Track.Kind.Video) {
            list[0].hasVideo = false;
          } else if(track.kind === Track.Kind.Audio) {
            if(track.source === Track.Source.Microphone) {
                let l = this.members.filter(item => item.uid === id)
                if (l.length)
                  l[0].micOn = false
            }
            list[0].audioStream=list[0].audioStream.filter(a => a.id!==item.id)
          }
        })
        console.log(!list[0].hasVideo,!list[0].audioStream.length)
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