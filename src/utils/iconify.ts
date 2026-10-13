import type { IconifyJSON } from '@iconify/types'
import { addCollection } from '@iconify/vue'
import collections from '@/assets/icons.generated.json'

/** Register only icons referenced by this theme, avoiding runtime CDN fetches. */
export async function setupIconify(): Promise<void> {
  for (const collection of collections)
    addCollection(collection as unknown as IconifyJSON)
}
