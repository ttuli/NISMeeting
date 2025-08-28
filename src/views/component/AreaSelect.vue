<template>
  <div class="mainArea">
    <el-cascader
      v-model="areaData.areaCode" 
      :options="AreaData"
      @change="change"
      ref="areaSelectRef"
      clearable
      class="cusSelect"
    />
  </div>
  
</template>

<script lang="ts" setup>
import { ref,reactive } from 'vue'
import AreaData from './AreaData'

const areaData = reactive({
  areaName: [],
  areaCode: []
})
const areaSelectRef = ref()
const change = (e: any) => {
  const checkedNodes = areaSelectRef.value.getCheckedNodes()[0]
  if (!checkedNodes) {
    areaData.areaName = []
    areaData.areaCode = []
    return
  }
  areaData.areaName = checkedNodes.pathLabels
}
defineExpose({
  areaData,
});
</script>

<style lang="scss" scoped>
.cusSelect {
    padding: 12px 16px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.2s ease;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
}
</style>
