import { defineStore } from 'pinia'
import { LocalStorage } from 'quasar'
import { exportDatabase, importDatabase } from 'src/services/sqlite'

const STORAGE_KEY = 'betta_config'

export const useConfiguracionStore = defineStore('configuracion', {
  state: () => {
    const saved = LocalStorage.getItem(STORAGE_KEY)
    return {
      theme: saved?.theme || 'light',
      defaultSexo: saved?.defaultSexo || 'indefinido',
      itemsPerPage: saved?.itemsPerPage || 20,
      importError: null,
    }
  },

  getters: {
    isDark: (state) => state.theme === 'dark',
  },

  actions: {
    setTheme(theme) {
      this.theme = theme
      this.save()
    },

    setDefaultSexo(sexo) {
      this.defaultSexo = sexo
      this.save()
    },

    setItemsPerPage(count) {
      this.itemsPerPage = count
      this.save()
    },

    save() {
      LocalStorage.set(STORAGE_KEY, {
        theme: this.theme,
        defaultSexo: this.defaultSexo,
        itemsPerPage: this.itemsPerPage,
      })
    },

    async exportBackup() {
      const data = await exportDatabase()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `betta_backup_${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      return data
    },

    async importBackup(file) {
      this.importError = null
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = async (e) => {
          try {
            const jsonData = JSON.parse(e.target.result)
            await importDatabase(jsonData)
            resolve(true)
          } catch (err) {
            this.importError = err.message
            reject(err)
          }
        }
        reader.onerror = () => {
          this.importError = 'Error al leer el archivo'
          reject(new Error(this.importError))
        }
        reader.readAsText(file)
      })
    },
  },
})
