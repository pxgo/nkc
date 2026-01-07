<template>
  <div class="metadata-editor">
    <h2 class="title">Metadata Editor</h2>
    <p class="description">Edit and preview metadata values.</p>
  </div>
</template>

<script>
export default {
  name: 'MetadataEditor',
  data() {
    return {
      // TODO: add fields for your metadata form
    };
  },
  methods: {
    // TODO: add save/preview handlers
  },
};
</script>

<style scoped>
.metadata-editor {
  padding: 16px;
}

.title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
}

.description {
  margin: 0;
  color: #555;
}
</style>
