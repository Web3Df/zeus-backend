import {mkdir, appendFile, readFile} from 'node:fs/promises';
import {dirname} from 'node:path';

export async function appendEvent(event, path = 'data/events.jsonl') {
  await mkdir(dirname(path), {recursive: true});
  await appendFile(path, `${JSON.stringify(event)}\n`, 'utf8');
  return {path, execution_id: event.execution_id, checksum_sha256: event.checksum_sha256};
}

export async function readEvents(path = 'data/events.jsonl') {
  try {
    const content = await readFile(path, 'utf8');
    return content.split('\n').filter(Boolean).map(line => JSON.parse(line));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}
