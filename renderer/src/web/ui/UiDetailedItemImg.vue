<template>
  <div
    v-if="icon"
    class="inline-block relative overflow-hidden align-top bg-gray-900 bg-opacity-60"
    :style="containerStyle"
  >
    <img :src="icon" class="block w-full h-full object-contain" draggable="false">
    <div v-if="layout.length" class="absolute inset-0 pointer-events-none">
      <div
        v-for="link in links"
        :key="link.key"
        class="absolute h-[5px] bg-gray-500 border border-gray-900 origin-left z-0"
        :style="link.style"
      />
      <div
        v-for="socket in layout"
        :key="socket.index"
        class="absolute w-[26px] h-[26px] rounded-full border-[3px] border-gray-300 shadow-[0_0_0_2px_#171717] z-10"
        :style="socket.style"
      >
        <div class="absolute inset-[4px] rounded-full bg-black bg-opacity-50" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import type { DisplaySocket } from '@/web/price-check/trade/trade-tooltip'

const props = withDefaults(defineProps<{
  icon: string
  itemWidth?: number
  itemHeight?: number
  sockets?: DisplaySocket[]
}>(), {
  itemWidth: 1,
  itemHeight: 1,
  sockets: () => []
})

const CELL = 48
const SOCKET_SIZE = 26

const containerStyle = computed<CSSProperties>(() => ({
  width: `${Math.max(1, props.itemWidth) * CELL}px`,
  height: `${Math.max(1, props.itemHeight) * CELL}px`
}))

function socketCenter (index: number): { x: number, y: number } {
  const width = Math.max(1, props.itemWidth) * CELL
  const height = Math.max(1, props.itemHeight) * CELL
  if (props.itemWidth <= 1) {
    return { x: width / 2, y: Math.min(height - 16, 16 + index * CELL) }
  }

  const row = Math.floor(index / 2)
  const fromLeft = row % 2 === 0 ? index % 2 === 0 : index % 2 === 1
  const x = fromLeft ? 16 : width - 16
  const rows = Math.ceil((props.sockets?.length ?? 0) / 2)
  const y = rows <= 1
    ? height / 2
    : 16 + row * ((height - 32) / (rows - 1))
  return { x, y }
}

function socketColor (socket: DisplaySocket): string {
  const color = socket.sColour ?? ({ S: 'R', D: 'G', I: 'B', G: 'W', A: 'A' } as Record<string, string>)[socket.attr ?? '']
  return ({
    R: '#c95a4d',
    G: '#57a957',
    B: '#4f78c4',
    W: '#d7d7d7',
    A: '#222222'
  } as Record<string, string>)[color ?? ''] ?? '#777777'
}

const layout = computed(() => (props.sockets ?? []).map((socket, index) => {
  const center = socketCenter(index)
  return {
    index,
    socket,
    center,
    style: {
      left: `${center.x - SOCKET_SIZE / 2}px`,
      top: `${center.y - SOCKET_SIZE / 2}px`,
      backgroundColor: socketColor(socket)
    } as CSSProperties
  }
}))

const links = computed(() => layout.value.slice(0, -1).flatMap((socket, index) => {
  const next = layout.value[index + 1]
  if (socket.socket.group !== next.socket.group) return []
  const dx = next.center.x - socket.center.x
  const dy = next.center.y - socket.center.y
  const length = Math.sqrt(dx * dx + dy * dy)
  return [{
    key: `${index}-${index + 1}`,
    style: {
      left: `${socket.center.x}px`,
      top: `${socket.center.y - 2.5}px`,
      width: `${length}px`,
      transform: `rotate(${Math.atan2(dy, dx)}rad)`
    } as CSSProperties
  }]
}))
</script>
