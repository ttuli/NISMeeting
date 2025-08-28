import { defineStore } from "pinia";
import { reactive } from "vue";

export interface UserInfo {
    userId: string
    phone: string
    nickName: string
    sex: number
    personalSignature: string
    createTime: number
    areaCode: string
    areaName: string
}

export const useUserInfoStore = defineStore("userInfo", {
  state: () => ({
    userInfo: {
        userId: "",
        phone: "",
        nickName: "",
        sex: 0,
        personalSignature: "",
        createTime: 0,
        areaCode:"",
        areaName: "",
    },
    token:"",
    avatarUpdate:reactive(new Map<string, number>())
  }),
  actions: {
    setUserInfo(userInfo : any , token : string) {
      Object.assign(this.userInfo,userInfo)
      if (token!=='')
        this.token = token;
      console.dir(this.userInfo)
    },
    clearUserInfo() {
        this.userInfo = {
            userId: "",
            phone: "",
            nickName: "",
            sex: 0,
            personalSignature: "",
            createTime: 0,
            areaName:"",
            areaCode:""
        };
        this.token = "";
    },
    getOrInit(key : string) {
      if(!this.avatarUpdate.has(key)){
        this.avatarUpdate.set(key,0)
      }
      return this.avatarUpdate.get(key)
    },
    addUpdateFrequency(key : string) {
      let n=this.getOrInit(key)
      if (n===undefined) {
        n=0
      }
      this.avatarUpdate.set(key,n+1)
    }
  },
});