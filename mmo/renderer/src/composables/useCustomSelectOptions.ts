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

export function useCustomSelectOptions(
  fieldName: string,
  defaultOptions: Ref<SelectOption[]>,
  formApiRef: Ref<FormApi | null>,
) {
  const storageKey = `custom-select-options:${fieldName}`;
  const customTags = useStorage<string[]>(storageKey, []);

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

  function handleChange(selectedValues: string | string[]) {
    const values = Array.isArray(selectedValues)
      ? selectedValues
      : [selectedValues];

    const defaultValues = new Set(defaultOptions.value.map((opt) => opt.value));
    const newCustomTags = values.filter(
      (val) =>
        val && !defaultValues.has(val) && !customTags.value.includes(val),
    );

    if (newCustomTags.length > 0) {
      customTags.value.push(...newCustomTags);
    }
  }

  function removeCustomTag(tagToRemove: string) {
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
  }

  return { combinedOptions, handleChange };
}
