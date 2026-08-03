import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execFileSync } from 'node:child_process'

const environment = globalThis.process?.env ?? {}

const repositoryName = () => {
  const githubRepository = environment.GITHUB_REPOSITORY?.split('/').pop()
  if (githubRepository) return githubRepository

  try {
    const remote = execFileSync('git', ['config', '--get', 'remote.origin.url'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()

    return remote.replace(/\/$/, '').split('/').pop()?.replace(/\.git$/, '')
  } catch {
    return environment.npm_package_name
  }
}

const pagesBase = () => {
  const repository = repositoryName()
  const owner = environment.GITHUB_REPOSITORY_OWNER

  return repository && repository.toLowerCase() !== `${owner}.github.io`.toLowerCase()
    ? `/${repository}/`
    : '/'
}

// https://vite.dev/config/
export default defineConfig({
  base: pagesBase(),
  plugins: [react()],
  build: {
    cssMinify: true,
    minify: true,
    reportCompressedSize: true,
    sourcemap: false,
    target: 'es2020',
  },
})
