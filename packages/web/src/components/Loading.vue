<template>
  <div>
    <div class="loader"></div>
  </div>
</template>

<script>
export default {
  name: 'Loading',
  data() {
    return {
      mounted: false,
    }
  },
  mounted() {
    this.mounted = true;
  },
  beforeUnmount() {
    this.mounted = false;
  },
}
</script>

<style scoped>
  .loader {
    width: 100%;
    height: 100%;
    font-size: 10px;
    position: relative;
    text-indent: -9999em;
    border-top: 0.25rem solid rgba(255, 255, 255, 0.2);
    border-right: 0.25rem solid rgba(255, 255, 255, 0.2);
    border-bottom: 0.25rem solid rgba(255, 255, 255, 0.2);
    border-left: 0.25rem solid var(--theme-color-main);
    border-radius: 50%;
    -webkit-transform: translateZ(0);
    -ms-transform: translateZ(0);
    transform: translateZ(0);
    -webkit-animation: load8 1.1s infinite linear;
    animation: load8 1.1s infinite linear;
  }
  @-webkit-keyframes load8 {
    0% {
      -webkit-transform: rotate(0deg);
      transform: rotate(0deg);
    }
    100% {
      -webkit-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }
  @keyframes load8 {
    0% {
      -webkit-transform: rotate(0deg);
      transform: rotate(0deg);
    }
    100% {
      -webkit-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }


</style>
