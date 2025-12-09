<script lang="ts">
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import IconButton from '/@/component/button/IconButton.svelte';

interface Props {
  onEdit: () => void;
}
const { onEdit }: Props = $props();
</script>

<IconButton title="Edit Context" icon={faPenToSquare} onClick={onEdit} />
