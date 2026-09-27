import { Avatar, type AvatarTextGradient } from '@maxhub/max-ui'

const GRADIENTS: AvatarTextGradient[] = ['red', 'orange', 'green', 'blue', 'purple']

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function initials(title: string): string {
  const words = title.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  // Phone-number titles: a single digit reads better than two.
  if (/^\d/.test(words[0])) return words[0][0]
  return words
    .slice(0, 2)
    .map((w) => [...w][0].toUpperCase())
    .join('')
}

interface Props {
  id: string
  title: string
  size?: number
}

/** Round avatar with colored-initials fallback; the color is stable per chat id. */
export function ChatAvatar({ id, title, size = 48 }: Props) {
  return (
    <Avatar.Container size={size} form="circle">
      <Avatar.Text gradient={GRADIENTS[hash(id) % GRADIENTS.length]} style={{ fontSize: size * 0.38 }}>
        {initials(title)}
      </Avatar.Text>
    </Avatar.Container>
  )
}
