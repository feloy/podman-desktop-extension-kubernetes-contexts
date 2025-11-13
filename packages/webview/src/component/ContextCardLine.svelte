<script lang="ts">
interface Props {
  title: string;
  value: string;
  label: string;
}

const { title, value, label }: Props = $props();
</script>

<div class="bg-(--pd-content-bg) p-2 rounded-lg mt-1 grid grid-cols-6">
  <span class="my-auto font-bold col-span-1 text-right overflow-hidden text-ellipsis">{title}</span>
  <span class="my-auto col-span-5 text-left ml-3 overflow-hidden text-ellipsis" aria-label={label}>{value}</span>
</div>
