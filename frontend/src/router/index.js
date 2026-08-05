import { createRouter, createWebHistory } from "vue-router";
import LegacyPageView from "../views/LegacyPageView.vue";

const moduleRoutes = [
  { path: "/modules/overview", name: "overview", source: "/dashboard.html", title: "北粮南运通道综合驾驶舱" },
  { path: "/modules/trusted", name: "trusted", source: "/可信数据空间.html", title: "北粮南运可信数据空间" },
  { path: "/modules/intermodal", name: "intermodal", source: "/多式联运.html", title: "北粮南运多式联运" },
  { path: "/modules/passport", name: "passport", source: "/一粮一链.html", title: "一粮一链联运凭证" },
  { path: "/modules/value-added", name: "value-added", source: "/供应链增值.html", title: "供应链金融与交易可信服务" },
  { path: "/admin/database", name: "database-admin", source: "/database-admin.html", title: "本地数据库管理" },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", redirect: "/modules/overview" },
    ...moduleRoutes.map(({ path, name, source, title }) => ({
      path,
      name,
      component: LegacyPageView,
      props: { source, title },
    })),
    { path: "/:pathMatch(.*)*", redirect: "/modules/overview" },
  ],
});

export default router;
