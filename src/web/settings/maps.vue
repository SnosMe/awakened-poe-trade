<template>
  <div class="p-2">
    <div class="bg-gray-700 rounded px-2 py-1 mb-2 leading-none">
      <i class="fas fa-info-circle"></i> You can click on stat to cycle through available marks:<br>danger, warning, desirable, none.</div>
    <div>
      <table>
        <thead>
          <tr>
            <th>Stat</th>
            <th>Invert</th>
            <th>Danger</th>
            <th>Warning</th>
            <th>Desirable</th>
            <th>DEL</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>#% increased Monster Life</td>
            <td><div class="flex justify-center"><ui-toggle/></div></td>
            <td><input class="bg-gray-900 rounded w-12 text-center"></td>
            <td><input class="bg-gray-900 rounded w-12 text-center"></td>
            <td><input class="bg-gray-900 rounded w-12 text-center"></td>
            <td>DEL</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { Config } from '@/web/Config'

export default {
  computed: {
    config () {
      return Config.store
    }
  }
}
</script>
