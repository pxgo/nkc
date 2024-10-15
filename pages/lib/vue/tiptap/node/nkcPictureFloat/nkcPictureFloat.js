import { mergeAttributes, Node } from '@tiptap/vue-2';
import { VueNodeViewRenderer } from '@tiptap/vue-2';

import Component from './Component.vue';

export default Node.create({
  name: 'nkc-picture-float',
  group: 'block',
  content: 'block+',

  addAttributes() {
    return {
      id: '',
      float: '', // left or right
    };
  },

  parseHTML() {
    return [
      {
        tag: 'nkc-picture-float',
      },
    ];
  },

  renderHTML(props) {
    const { HTMLAttributes } = props;
    return ['nkc-picture-float', mergeAttributes(HTMLAttributes), 0];
  },

  addNodeView() {
    return VueNodeViewRenderer(Component);
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        // 自定义 Enter 行为，防止节点分裂
        this.editor.commands.splitBlock(); // 分裂块并换行
        return true; // 返回 true 表示已处理，不再分裂节点
      },
    };
  },
});