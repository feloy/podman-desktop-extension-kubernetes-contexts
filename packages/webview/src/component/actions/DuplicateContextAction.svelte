<script lang="ts">
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import IconButton from '/@/component/button/IconButton.svelte';
import { Remote } from '/@/remote/remote';
import { getContext } from 'svelte';
import { API_CONTEXTS } from '@kubernetes-contexts/channels';

interface Props {
  name: string;
}
const { name }: Props = $props();

const remote = getContext<Remote>(Remote);
const contextsApi = remote.getProxy(API_CONTEXTS);

async function duplicateContext(): Promise<void> {
  await contextsApi.duplicateContext(name);
}
</script>

<IconButton title="Duplicate Context" icon={faCopy} onClick={duplicateContext} />
