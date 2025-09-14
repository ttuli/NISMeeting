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
  createLocalTracks,
  DisconnectReason,
  MediaDeviceFailure,
  LogLevel,
  RoomConnectOptions,
  LocalAudioTrack,
  LocalVideoTrack
} from 'livekit-client';
import { useMeetingStore } from '@/stores/meetingStore'
import { useUserInfoStore } from '@/stores/userInfoStore'
import { ElMessage } from 'element-plus';
import { nextTick } from 'vue';
import { lstat } from 'original-fs';
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

  // ============ 麦克风控制 ============
  async enableMicrophone(): Promise<LocalTrackPublication | undefined> {
    try {
      await this.room.localParticipant.setMicrophoneEnabled(true);
      console.log('麦克风已开启');
      
      return this.room.localParticipant.getTrackPublication(Track.Source.Microphone);
    } catch (error) {
      console.error('开启麦克风失败:', error);
      const failure = MediaDeviceFailure.getFailure(error);
      if (failure) {
        console.error('设备错误类型:', failure);
      }
      throw error;
    }
  }

  async disableMicrophone(): Promise<void> {
    try {
      await this.room.localParticipant.setMicrophoneEnabled(false);
      console.log('麦克风已关闭');
    } catch (error) {
      console.error('关闭麦克风失败:', error);
      throw error;
    }
  }

  async setLocalTrack(captureSystemVideo: boolean,captureSystemAudio: boolean,captureMicro: boolean) {
    try {
      const id = userInfoStore.userInfo.userId
      const microTrack = await this.room.localParticipant.setMicrophoneEnabled(captureMicro);
      const publication = await this.room.localParticipant.setScreenShareEnabled(captureSystemVideo, { audio: captureSystemAudio });
      let list = meetingStore.participants.filter(item => item.id===id)
      if (!list.length) {
        meetingStore.participants.push({
          id:id,
          name:userInfoStore.userInfo.nickName,
          hasVideo:false,
          audioStream:[]
        })
        list = meetingStore.participants.filter(item => item.id===id)
      } else {
        list[0].hasVideo = false;
        list[0].audioStream = []
      }
      const tracks: (LocalAudioTrack | LocalVideoTrack)[] = []
      if (publication?.audioTrack !== undefined) {
        tracks.push(publication.audioTrack)
      }
      if (publication?.videoTrack !== undefined) {
        tracks.push(publication.videoTrack)
      }
      if (microTrack?.audioTrack !== undefined) {
        tracks.push(microTrack.audioTrack)
      }
      tracks.forEach(track => {
        if(track.kind===Track.Kind.Audio) {
          const uid = crypto.randomUUID()
          list[0].audioStream.push({
            id:uid,
            muted:false
          })
        } else if(track.kind===Track.Kind.Video) {
          list[0].hasVideo=false;
        }
      })
        
    } catch (error) {
      console.error('开启屏幕共享失败:', error);
      throw error;
    }
  
  }

  // ============ 屏幕共享控制（包含系统声音）============
  async setScreenShare(captureSystemVideo: boolean,captureSystemAudio: boolean = true) {
    try {
      const id = userInfoStore.userInfo.userId
      const publication = await this.room.localParticipant.setScreenShareEnabled(captureSystemVideo, { audio: captureSystemAudio });
      if (publication?.audioTrack !== undefined) {
        meetingStore.addAudioTrack(id,"我",publication.audioTrack)
      }
      if (publication?.videoTrack !== undefined) {
        meetingStore.addVideoTrack(id,"我",publication.videoTrack)
      }
      console.log('屏幕共享已开启，包含系统声音:', captureSystemAudio);
        
    } catch (error) {
      console.error('开启屏幕共享失败:', error);
      throw error;
    }
  }

  // ============ 手动创建和发布轨道 ============
  async createAndPublishTracks(options: {
    audio?: boolean;
    video?: boolean;
  }): Promise<LocalTrackPublication[]> {
    try {
      // 创建本地轨道
      const tracks = await createLocalTracks({
        audio: options.audio ?? true,
        video: options.video ?? true,
      });

      const publications: LocalTrackPublication[] = [];

      // 发布所有轨道
      for (const track of tracks) {
        const publication = await this.room.localParticipant.publishTrack(track, {
          name: `custom-${track.kind}`,
          simulcast: track.kind === Track.Kind.Video, // 视频轨道开启simulcast
          source: track.kind === Track.Kind.Video ? Track.Source.Camera : Track.Source.Microphone,
        });
        publications.push(publication);
      }

      console.log('轨道创建并发布成功');
      return publications;
    } catch (error) {
      console.error('创建和发布轨道失败:', error);
      throw error;
    }
  }

  // ============ 发布自定义MediaStreamTrack ============
  async publishCustomTrack(
    mediaStreamTrack: MediaStreamTrack,
    options: {
      name?: string;
      source?: Track.Source;
      simulcast?: boolean;
    } = {}
  ): Promise<LocalTrackPublication> {
    try {
      const publication = await this.room.localParticipant.publishTrack(mediaStreamTrack, {
        name: options.name || `custom-${mediaStreamTrack.kind}`,
        simulcast: options.simulcast ?? false,
        source: options.source || Track.Source.Camera,
      });

      console.log('自定义轨道发布成功');
      return publication;
    } catch (error) {
      console.error('发布自定义轨道失败:', error);
      throw error;
    }
  }

  // ============ 取消发布轨道 ============
  async unpublishTrack(track: MediaStreamTrack | LocalTrackPublication): Promise<void> {
    try {
      if (track instanceof MediaStreamTrack) {
        await this.room.localParticipant.unpublishTrack(track);
      } else {
        await this.room.localParticipant.unpublishTrack(track.track!);
      }
      console.log('轨道已取消发布');
    } catch (error) {
      console.error('取消发布轨道失败:', error);
      throw error;
    }
  }

  // ============ 静音/取消静音轨道 ============
  async setTrackMuted(publication: LocalTrackPublication, muted: boolean): Promise<void> {
    try {
      muted ? await publication.mute() : await publication.unmute()
      console.log(`轨道${muted ? '静音' : '取消静音'}成功`);
    } catch (error) {
      console.error('设置轨道静音状态失败:', error);
      throw error;
    }
  }

  // ============ 获取远程参与者 ============
  getRemoteParticipants(): RemoteParticipant[] {
    return Array.from(this.room.remoteParticipants.values());
  }

  // 根据identity获取远程参与者
  getRemoteParticipantByIdentity(identity: string): RemoteParticipant | undefined {
    return this.room.remoteParticipants.get(identity);
  }

  // ============ 订阅远程参与者轨道 ============
  subscribeToParticipantTracks(participantIdentity: string, trackKinds?: Track.Kind[]): void {
    const participant = this.getRemoteParticipantByIdentity(participantIdentity);
    if (!participant) {
      console.error('找不到参与者:', participantIdentity);
      return;
    }

    participant.trackPublications.forEach((publication: RemoteTrackPublication) => {
      // 如果指定了轨道类型，只订阅匹配的类型
      if (trackKinds && !trackKinds.includes(publication.kind)) {
        return;
      }

      if (!publication.isSubscribed) {
        publication.setSubscribed(true);
        console.log(`已订阅 ${participant.identity} 的 ${publication.kind} 轨道`);
      }
    });
  }

  // 订阅所有远程参与者的轨道
  subscribeToAllParticipants(trackKinds?: Track.Kind[]): void {
    this.room.remoteParticipants.forEach((participant) => {
      participant.trackPublications.forEach((publication: RemoteTrackPublication) => {
        if (trackKinds && !trackKinds.includes(publication.kind)) {
          return;
        }

        if (!publication.isSubscribed) {
          publication.setSubscribed(true);
        }
      });
    });
  }

  // 取消订阅轨道
  unsubscribeFromTrack(participantIdentity: string, trackSid: string): void {
    const participant = this.getRemoteParticipantByIdentity(participantIdentity);
    if (!participant) return;

    const publication = participant.getTrackPublicationBySid(trackSid);
    if (publication && publication.isSubscribed) {
      publication.setSubscribed(false);
      console.log(`已取消订阅轨道: ${trackSid}`);
    }
  }

  // ============ 获取特定类型的远程轨道 ============
  getRemoteVideoTrack(participantIdentity: string): RemoteTrack | undefined {
    const participant = this.getRemoteParticipantByIdentity(participantIdentity);
    if (!participant || !participant.isCameraEnabled) return undefined;

    const publication = participant.getTrackPublication(Track.Source.Camera);
    // return publication?.isSubscribed ? publication.videoTrack : undefined;
  }

  getRemoteAudioTrack(participantIdentity: string): RemoteTrack | undefined {
    const participant = this.getRemoteParticipantByIdentity(participantIdentity);
    if (!participant || !participant.isMicrophoneEnabled) return undefined;

    const publication = participant.getTrackPublication(Track.Source.Microphone);
    // return publication?.isSubscribed ? publication.audioTrack : undefined;
  }

  // ============ 轨道绑定到HTML元素 ============
  attachTrackToElement(track: RemoteTrack, elementId?: string): HTMLMediaElement {
    // 创建或获取HTML元素
    const element = track.attach();
    
    if (elementId) {
      const targetElement = document.getElementById(elementId);
      if (targetElement) {
        targetElement.appendChild(element);
      }
    }

    return element;
  }

  // ============ 设备管理 ============
  async getAvailableDevices(kind: MediaDeviceKind): Promise<MediaDeviceInfo[]> {
    try {
      return await Room.getLocalDevices(kind);
    } catch (error) {
      console.error('获取设备列表失败:', error);
      throw error;
    }
  }

  async switchAudioDevice(deviceId: string): Promise<void> {
    try {
      await this.room.switchActiveDevice('audioinput', deviceId);
      console.log('音频设备切换成功');
    } catch (error) {
      console.error('切换音频设备失败:', error);
      throw error;
    }
  }

  async switchVideoDevice(deviceId: string): Promise<void> {
    try {
      await this.room.switchActiveDevice('videoinput', deviceId);
      console.log('视频设备切换成功');
    } catch (error) {
      console.error('切换视频设备失败:', error);
      throw error;
    }
  }

  // ============ 音频播放管理 ============
  async startAudioPlayback(): Promise<void> {
    try {
      await this.room.startAudio();
      console.log('音频播放已开始');
    } catch (error) {
      console.error('开始音频播放失败:', error);
      throw error;
    }
  }

  canPlayAudio(): boolean {
    return this.room.canPlaybackAudio;
  }

  // ============ RPC 方法注册和调用 ============
  registerRpcMethod(methodName: string, handler: (data: any) => Promise<any>): void {
    this.room.localParticipant?.registerRpcMethod(methodName, handler);
    console.log(`RPC方法已注册: ${methodName}`);
  }

  async performRpc(options: {
    destinationIdentity: string;
    method: string;
    payload: string;
    responseTimeout?: number;
  }): Promise<string> {
    try {
      const response = await this.room.localParticipant!.performRpc({
        destinationIdentity: options.destinationIdentity,
        method: options.method,
        payload: options.payload,
        responseTimeout: options.responseTimeout,
      });
      console.log('RPC调用成功:', response);
      return response;
    } catch (error) {
      console.error('RPC调用失败:', error);
      throw error;
    }
  }

  // ============ 事件处理设置 ============
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
      switch(track.kind) {
        case Track.Kind.Audio:
          meetingStore.addAudioTrack(data.uid,data.name,track)
          break;
        case Track.Kind.Video:
          meetingStore.addVideoTrack(data.uid,data.name,track)
      }
    });

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
      publication.track?.detach();
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

  // ============ 房间状态和信息 ============
  getRoomInfo() {
    return {
      isConnected: this.isConnected,
      roomName: this.room.name,
      localParticipant: {
        identity: this.room.localParticipant.identity,
        isCameraEnabled: this.room.localParticipant.isCameraEnabled,
        isMicrophoneEnabled: this.room.localParticipant.isMicrophoneEnabled,
        isScreenShareEnabled: this.room.localParticipant.isScreenShareEnabled,
      },
      remoteParticipants: this.getRemoteParticipants().map(p => ({
        identity: p.identity,
        isCameraEnabled: p.isCameraEnabled,
        isMicrophoneEnabled: p.isMicrophoneEnabled,
        isScreenShareEnabled: p.isScreenShareEnabled,
      })),
      canPlaybackAudio: this.room.canPlaybackAudio,
    };
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