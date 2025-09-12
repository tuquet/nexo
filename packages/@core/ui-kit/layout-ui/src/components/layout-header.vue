<script setup lang="ts">
import type { CSSProperties, VNode } from 'vue';

import { Comment, computed, Fragment, Text, useSlots } from 'vue';

interface Props {
  /**
   * 横屏
   */
  fullWidth: boolean;
  /**
   * 高度
   */
  height: number;
  /**
   * 是否移动端
   */
  isMobile: boolean;
  /**
   * 是否显示
   */
  show: boolean;
  /**
   * 侧边菜单宽度
   */
  sidebarWidth: number;
  /**
   * 主题
   */
  theme: string | undefined;
  /**
   * 宽度
   */
  width: string;
  /**
   * zIndex
   */
  zIndex: number;
}

const props = withDefaults(defineProps<Props>(), {});

const slots = useSlots();

const style = computed((): CSSProperties => {
  const { fullWidth, height, show } = props;
  const right = !show || !fullWidth ? undefined : 0;

  return {
    height: `${height}px`,
    marginTop: show ? 0 : `-${height}px`,
    right,
  };
});

/**
 * Checks if a slot has any actual renderable nodes, ignoring comments,
 * empty text nodes, and empty fragments.
 */
function hasVisibleContent(slot: ((...args: any[]) => VNode[]) | undefined) {
  if (!slot) {
    return false;
  }
  return slot().some((vnode: VNode) => {
    if (vnode.type === Comment) {
      return false;
    }
    if (vnode.type === Text && `${vnode.children}`.trim() === '') {
      return false;
    }
    if (vnode.type === Fragment && (vnode.children as VNode[]).length === 0) {
      return false;
    }
    return true;
  });
}

const hasLogoContent = computed(() => hasVisibleContent(slots.logo));

const logoStyle = computed((): CSSProperties => {
  return {
    minWidth: `${props.isMobile ? 40 : props.sidebarWidth}px`,
  };
});
</script>

<template>
  <header
    :class="theme"
    :style="style"
    class="border-border bg-header top-0 flex w-full flex-[0_0_auto] items-center border-b pl-2 transition-[margin-top] duration-200"
  >
    <div v-if="hasLogoContent" :style="logoStyle">
      <slot name="logo"></slot>
    </div>

    <slot name="toggle-button"> </slot>

    <slot></slot>
  </header>
</template>
