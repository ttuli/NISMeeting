import {
  Room,
  RoomEvent,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  Track,
  VideoPresets,
  LocalTrackPublication,
  LocalParticipant,
  Participant,
  DisconnectReason,
  MediaDeviceFailure,
  LogLevel,
  RoomConnectOptions,
  LocalAudioTrack,
  LocalVideoTrack,
  DataPacket_Kind
} from 'livekit-client';
import { useMeetingStore } from '@/stores/meetingStore'
import { useUserInfoStore } from '@/stores/userInfoStore'
import { ElMessage } from 'element-plus';
import { nextTick } from 'vue';
const meetingStore = useMeetingStore()
const userInfoStore = useUserInfoStore()

interface LiveKitManagerOptions {
  adaptiveStream?: boolean;
  dynacast?: boolean;
  videoCaptureDefaults?: {
    resolution?: { width: number; height: number; };
  };
  logLevel?: LogLevel;
}

class LiveKitManager {
  private room: Room;
  private isConnected: boolean = false;

  constructor(options: LiveKitManagerOptions = {},url? : string) {
    this.room = new Room({
      // 自动管理订阅视频质量
      adaptiveStream: options.adaptiveStream ?? true,
      // 优化发布带宽和CPU
      dynacast: options.dynacast ?? true,
      // 默认捕获设置
      videoCaptureDefaults: {
        resolution: options.videoCaptureDefaults?.resolution ?? VideoPresets.h720.resolution,
      },
    });
    if (url) {
        this.room.prepareConnection(url)
    }

    this.setupEventHandlers();
  }

  // ============ 连接房间 ============
  async connectToRoom(url: string, token: string, options?: RoomConnectOptions): Promise<void> {
    try {
      // 连接到房间
      await this.room.connect(url, token, {
        ...options,
        rtcConfig:{
            iceServers:[
                {urls:"stun:stun.l.google.com:19302"}
            ]
        }
      });
      this.isConnected = true;
      if (this.room.metadata) {
        const data = JSON.parse(this.room.metadata)
        Object.assign(meetingStore.meeting,data)
        window.ipcRenderer.send('new-meeting',{...meetingStore.meeting})
      }
      const participants = [
        this.room.localParticipant,
        ...Array.from(this.room.remoteParticipants.values())
      ];
      participants.forEach(p => {
        if (p.metadata)
          meetingStore.members.push({
            ...JSON.parse(p.metadata),
            micOn:false
          })
      })

      console.log('成功连接到房间:', this.room.name);
    } catch (error) {
      console.error('连接房间失败:', error);
      throw error;
    }
  }

  // ============ 摄像头控制 ============
  async enableCamera(): Promise<LocalTrackPublication | undefined> {
    try {
      await this.room.localParticipant.setCameraEnabled(true);
      console.log('摄像头已开启');
      
      // 返回摄像头轨道发布对象
      return this.room.localParticipant.getTrackPublication(Track.Source.Camera);
    } catch (error) {
      console.error('开启摄像头失败:', error);
      // 检查具体错误类型
      const failure = MediaDeviceFailure.getFailure(error);
      if (failure) {
        console.error('设备错误类型:', failure);
      }
      throw error;
    }
  }

  async disableCamera(): Promise<void> {
    try {
      await this.room.localParticipant.setCameraEnabled(false);
      console.log('摄像头已关闭');
    } catch (error) {
      console.error('关闭摄像头失败:', error);
      throw error;
    }
  }

  async setLocalTrack(captureSystemVideo: boolean,captureSystemAudio: boolean,captureMicro: boolean) {
    try {
      const id = userInfoStore.userInfo.userId
      const microTrack = await this.room.localParticipant.setMicrophoneEnabled(captureMicro);
      //防止直接false导致audio track仍在使用
      let publication;
      if (!captureSystemVideo) {
        publication = await this.room.localParticipant.setScreenShareEnabled(false);
      } else {
        publication = await this.room.localParticipant.setScreenShareEnabled(captureSystemVideo, { audio: captureSystemAudio });
      }
      let list = meetingStore.participants.filter(item => item.id===id)
      const tracks: (LocalAudioTrack | LocalVideoTrack)[] = []
      let l = meetingStore.members.filter(item => item.uid === id)
      if (l.length) {
        l[0].micOn = captureMicro
      }
      if (publication?.audioTrack !== undefined) {
        tracks.push(publication.audioTrack)
      }
      if (publication?.videoTrack !== undefined) {
        tracks.push(publication.videoTrack)
      }
      if (microTrack?.audioTrack !== undefined) {
        tracks.push(microTrack.audioTrack)
      }
      if (!list.length && tracks.length) {
        meetingStore.participants.push({
          id:id,
          name:userInfoStore.userInfo.nickName,
          hasVideo:false,
          audioStream:[]
        })
        list = meetingStore.participants.filter(item => item.id===id)
      } else if(tracks.length) {
        list[0].hasVideo = false;
        list[0].audioStream = []
      } else {
        list = []
        meetingStore.participants = meetingStore.participants.filter(item => item.id!==id)
      }
      tracks.forEach(track => {
        if(track.kind===Track.Kind.Audio) {
          const uid = crypto.randomUUID()
          list[0].audioStream.push({
            id:uid,
            muted:false
          })
        } else if(track.kind===Track.Kind.Video) {
          list[0].hasVideo=true;
        }
      })
      nextTick(() => {
        if(!tracks.length) return
        tracks.forEach(track => {
        if(track.kind===Track.Kind.Audio) {
          list[0].audioStream.forEach(a => {
            const el = document.getElementById(a.id) as HTMLMediaElement
            if (el)
              track.attach(el)
          })
        } else if(track.kind===Track.Kind.Video) {
          const el = document.getElementById("video-"+id) as HTMLMediaElement
            if (el)
              track.attach(el)
        }
      })
      })
        
    } catch (error) {
      console.error('开启屏幕共享失败:', error);
      throw error;
    }
  
  }
  
  private setupEventHandlers(): void {
    // 参与者连接
    this.room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
      if(participant.metadata) {
        const data = JSON.parse(participant.metadata)
        if (meetingStore.members.filter(item => item.uid === participant.identity).length !== 0)
          return
        meetingStore.members.push({
          uid:participant.identity,
          name:data.name,
          micOn:false
        })
      } else {
        console.log("invaild participant")
      }
    });

    // 参与者断开
    this.room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
      console.log('参与者离开:', participant.identity);
      meetingStore.members = meetingStore.members.filter(item => item.uid!==participant.identity)
      meetingStore.participants = meetingStore.participants.filter(item => item.id !== participant.identity)
      if (participant.identity === meetingStore.meeting.hostId && meetingStore.members.length !==0 ) {
        meetingStore.meeting.hostId = meetingStore.members[0].uid
        if (userInfoStore.userInfo.userId === meetingStore.members[0].uid) {
          ElMessage.info("你已成为会议主持人")
        }
      }
    });

    // 轨道订阅成功
    this.room.on(RoomEvent.TrackSubscribed, (
      track: RemoteTrack,
      publication: RemoteTrackPublication,
      participant: RemoteParticipant,
    ) => {
      console.log(`订阅轨道成功: ${track.kind} 来自 ${participant.identity}`);
      if (!participant.metadata) {
        console.log("null participant.metadata")
        return
      }
      const data = JSON.parse(participant.metadata)
      if(track.kind === Track.Kind.Audio) {
        meetingStore.addAudioTrack(data.uid,data.name,track)
      } else if (track.kind === Track.Kind.Video) {
        meetingStore.addVideoTrack(data.uid,data.name,track)
      }
    });

    this.room.on(RoomEvent.TrackMuted, (pub, participant) => {
      if (pub.kind === Track.Kind.Audio && pub.track !== undefined) {
        if(pub.track.source === Track.Source.Microphone) {
          const l = meetingStore.members.filter(item => item.uid === participant.identity)
          if (l.length)
            l[0].micOn = false;
        }
      }
    });

    this.room.on(RoomEvent.TrackUnmuted, (pub, participant) => {
      if (pub.kind === Track.Kind.Audio && pub.track !== undefined) {
        if(pub.track.source === Track.Source.Microphone) {
          const l = meetingStore.members.filter(item => item.uid === participant.identity)
          if (l.length)
            l[0].micOn = false;
        }
      }
    });

    this.room.on(RoomEvent.DataReceived,(
      payload: Uint8Array,
      participant?: RemoteParticipant,
      kind?: DataPacket_Kind,
      topic?: string
    ) => {

    })

    // 轨道取消订阅
    this.room.on(RoomEvent.TrackUnsubscribed, (
      track: RemoteTrack,
      publication: RemoteTrackPublication,
      participant: RemoteParticipant,
    ) => {
      console.log(`取消订阅轨道: ${track.kind} 来自 ${participant.identity}`);
      meetingStore.removeTrack(participant.identity,track)
    });

    // 本地轨道取消发布
    this.room.on(RoomEvent.LocalTrackUnpublished, (
      publication: LocalTrackPublication,
      participant: LocalParticipant,
    ) => {
      console.log('本地轨道取消发布');
      // if(publication.track !== undefined)
      // meetingStore.removeTrack(userInfoStore.userInfo.userId,publication.track)
    });

    // 活跃发言者变化
    this.room.on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
      console.log('活跃发言者:', speakers.map(s => s.identity));
    });

    // 音频播放状态变化
    this.room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
      console.log('音频播放状态变化，当前可播放:', this.room.canPlaybackAudio);
    });

    // 媒体设备错误
    this.room.on(RoomEvent.MediaDevicesError, (error: Error) => {
      console.error('媒体设备错误:', error);
      const failure = MediaDeviceFailure.getFailure(error);
      if (failure) {
        console.error('错误类型:', failure);
      }
    });

    // 连接断开
    this.room.on(RoomEvent.Disconnected, (reason?: DisconnectReason | undefined) => {
      console.log('连接断开:', reason);
      ElMessage.error('连接断开:' + reason)
      this.isConnected = false;
      meetingStore.cleanAll()
    });
  }

  // ============ 断开连接 ============
  async disconnect(): Promise<void> {
    try {
      await this.room.disconnect();
      this.isConnected = false;
      console.log('已断开房间连接');
    } catch (error) {
      console.error('断开连接失败:', error);
      throw error;
    }
  }
}

export default LiveKitManager;