import { Track } from "livekit-client";
import { defineStore } from "pinia";
import { reactive } from "vue";

interface AudioSource {
  id: string
  stream: MediaStream | undefined
  muted: boolean
}

interface Participant {
  id: string
  name: string
  videoStream: MediaStream | undefined;
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
      addTrack(id: string,name: string,kind: Track.Kind | undefined ,stream: MediaStream | undefined) {
        let isIn = false;
        if (!kind) {
          console.log("invaild kind")
          return
        }
        this.participants.forEach(item => {
          if(item.id===id){
            isIn=true
            if (kind === Track.Kind.Audio) {
              item.audioStream.push({
                id:id,
                stream:stream,
                muted:false
              })
            } else if (kind === Track.Kind.Video) {
              item.videoStream = stream
            }
          }
        })
        if (!isIn) {
          if (kind === Track.Kind.Video) {
            this.participants.push({
              id:id,
              name:name,
              videoStream: stream,
              audioStream:[]
            })
          } else if (kind === Track.Kind.Audio) {
            this.participants.push({
              id:id,
              name:name,
              videoStream: undefined,
              audioStream: [
                {
                  id:id,
                  muted:false,
                  stream:stream
                }
              ]
            })
          }
        }
      },
      removeTrack(id : string) {
        this.participants = this.participants.filter(item => item.id !== id)
      },
      cleanAll() {
        this.members = []
        this.participants = []
      }
    }
})