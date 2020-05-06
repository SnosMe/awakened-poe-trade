<template>
  <div class="absolute bg-red-500">
    <div>
      <slot :isEditing="isEditing" />
    </div>
    <div class="absolute bg-green-500" style="left: 100%; top: 0;">
      <button>close</button>
      <button @click="isEditing = !isEditing">edit</button>
      <button>move</button>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      isEditing: false
    }
  }
}
</script>
