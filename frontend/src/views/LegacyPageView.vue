<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

defineProps({
  source: { type: String, required: true },
  title: { type: String, required: true },
});

const router = useRouter();
const frame = ref(null);
const routeMap = {
  overview: "/modules/overview",
  trusted: "/modules/trusted",
  intermodal: "/modules/intermodal",
  passport: "/modules/passport",
  elements: "/modules/value-added",
};

function handleMessage(event) {
  if (event.origin !== window.location.origin || event.source !== frame.value?.contentWindow) return;
  if (event.data?.type !== "blny:navigate") return;
  const route = routeMap[event.data.view];
  if (route) router.push(route);
}

onMounted(() => window.addEventListener("message", handleMessage));
onBeforeUnmount(() => window.removeEventListener("message", handleMessage));
</script>

<template>
  <iframe ref="frame" class="reference-page-frame" :src="source" :title="title"></iframe>
</template>
