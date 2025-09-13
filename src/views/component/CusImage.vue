<template>
    <div class="mainContain">
        <el-image :src="avatarSrc" fit="cover" lazy class="image" :alt="alt" @click="checkDetail"/>
    </div>
</template>

<script lang="ts" setup>
import { ref,watch,onMounted, computed } from 'vue'
import { useUserInfoStore } from '@/stores/userInfoStore';

const props = withDefaults(defineProps<{
    uid?: string;
    alt?: string;
}>(),{
    uid: '',
    alt: '',
});
const userInfoStore = useUserInfoStore()
const avatarSrc = ref('')
const frequency = computed(() => {
  console.log('frequency updata',frequency.value)
  return userInfoStore.avatarUpdate.get(props.uid)
})

const checkDetail = () => {
    window.ipcRenderer.send('image-detali',avatarSrc.value)
}

watch(frequency, (newVal) => {
  console.log('frequency triggle')
  handleChange(props.uid);
});
watch(
  () => props.uid,   // 监听的源
  (newVal, oldVal) => {
    handleChange(newVal)
  }
)

function handleChange(uid: string) {
  if (uid !== '') {
    fetch(import.meta.env.VITE_OSS_URL + uid + ".png?t=" + frequency.value, {
      method: "HEAD"
    }).then((response) => {
      if(response.ok)
        avatarSrc.value = import.meta.env.VITE_OSS_URL + uid + ".png";
      else
        avatarSrc.value = import.meta.env.VITE_OSS_DEFAULT_AVATAR;
    }).catch((err) => {
      avatarSrc.value = import.meta.env.VITE_OSS_DEFAULT_AVATAR;
    });
  }
}

onMounted(() => {
  console.log(props.uid)
  handleChange(props.uid)
})
</script>

<style lang="scss" scoped>
.mainContain {
    // position: fixed;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    .image {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        cursor: pointer;
        transition: transform 0.3s;
        &:hover {
            transform: scale(1.05);
        }
    }
}
</style>