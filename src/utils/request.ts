import axios from "axios";
import { ElMessage } from "element-plus";
import { useUserInfoStore } from "@/stores/userInfoStore";

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 20000,
});
const userInfoStore = useUserInfoStore()

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    config.headers['Authorization'] = `Bearer ${userInfoStore.token}`
    return config;
  },
  (error) => {
    // 对请求错误做些什么
    ElMessage.error("请求错误，请稍后再试");
    return error.response;
  }
);

request.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.dir(error)
    console.log(error.message !== undefined)
    if (error.response != undefined && error.response.data != undefined) {
      ElMessage.error(error.response.data.message)
    } else if (error.message !== undefined) {
      ElMessage.error(error.message)
    }
    return Promise.reject(error)
  }
);

export default request;