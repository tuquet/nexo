import type { Ref, VNode } from 'vue';

import { computed, h } from 'vue';

import { $t } from '@vben/locales';

import { DeleteOutlined } from '@ant-design/icons-vue';
import { useStorage } from '@vueuse/core';
import { Button, Modal } from 'ant-design-vue';

interface SelectOption {
  label: (() => VNode) | string;
  value: any;
}

type FormApi = {
  getValues: () => Promise<any>;
  setValues: (values: any) => void;
};

/**
 * A composable to manage custom tags for a Select component.
 * It persists custom tags to localStorage and merges them with default options.
 *
 * @param fieldName - The unique name of the form field, used to create the localStorage key.
 * @param defaultOptions - A ref containing the array of default, static options.
 * @returns An object with combined options and a change handler.
 */
export function useCustomSelectOptions(
  fieldName: string,
  defaultOptions: Ref<SelectOption[]>,
  formApiRef: Ref<FormApi | null>,
) {
  const storageKey = `custom-select-options:${fieldName}`;
  const customTags = useStorage<string[]>(storageKey, []);

  const removeCustomTag = (tagToRemove: string) => {
    Modal.confirm({
      title: $t('page.confirmDelete.title'),
      content: $t('page.confirmDelete.content', { 0: tagToRemove }),
      okText: $t('page.confirmDelete.okText'),
      okType: 'danger',
      cancelText: $t('page.common.later'),
      onOk: async () => {
        // Remove from storage
        customTags.value = customTags.value.filter(
          (tag) => tag !== tagToRemove,
        );

        // If the tag is currently selected, remove it from the form value
        if (formApiRef.value) {
          const values = await formApiRef.value.getValues();
          const currentValues = (values[fieldName] as string[]) || [];
          if (currentValues.includes(tagToRemove)) {
            formApiRef.value.setValues({
              [fieldName]: currentValues.filter((v) => v !== tagToRemove),
            });
          }
        }
      },
    });
  };

  const combinedOptions = computed(() => {
    const customOptions = customTags.value.map((tag) => ({
      value: tag,
      label: () =>
        h('div', { class: 'flex items-center justify-between' }, [
          h('span', tag),
          h(Button, {
            type: 'text',
            danger: true,
            icon: h(DeleteOutlined),
            size: 'small',
            onClick: (e: Event) => {
              e.stopPropagation();
              removeCustomTag(tag);
            },
          }),
        ]),
    }));
    return [...defaultOptions.value, ...customOptions];
  });

  const handleChange = (selectedValues: string[]) => {
    const defaultValues = new Set(defaultOptions.value.map((opt) => opt.value));
    const newCustomTags = selectedValues.filter(
      (val) => !defaultValues.has(val) && !customTags.value.includes(val),
    );

    if (newCustomTags.length > 0) {
      customTags.value.push(...newCustomTags);
    }
  };

  return { combinedOptions, handleChange };
}
