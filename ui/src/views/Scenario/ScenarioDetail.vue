<template>
  <div v-if="loading" class="d-flex tw-justify-center tw-items-center page-loading">
    <v-progress-circular indeterminate="indeterminate" color="var(--cui-primary)"></v-progress-circular>
  </div>
  <div v-else>
    <div class="scenario" v-if="!showForm">
      <div gutters class="d-flex tw-flex-wrap tw-fixed">
        <!-- scenario detail section -->
        <div class="tw-w-full md:tw-w-3/4 lg:tw-w-2/3 xl:tw-w-3/4">
          <div class="scenario-wrapper">
            <div class="tw-px-5 tw-pt-7 scenario-detail-top">
              <div class="d-flex tw-gap-5 tw-flex-col lg:tw-flex-row lg:tw-space-x-4">
                <div class="scenario-img lg:tw-w-1/3">
                  <img
                    src="https://webapp-msejccxdwi33c.azurewebsites.net/static/media/ppt.542d050975f5a5cfc5df634d73b45069.svg"
                  />
                </div>
                <div class="lg:tw-w-1/2">
                  <h4 class="tw-text-2xl">{{ scenario.name }}</h4>
                  <p class="tw-text-sm tw-w-100 tw-mt-5">{{ scenario.overview }}</p>
                </div>
                <div class="lg:tw-w-1/6 tw-pr-10">
                  <v-btn
                    color="var(--cui-primary)"
                    class="tw-text-white py-5 tw-font-semibold"
                    @click="showForm = true"
                  >
                    GET THIS
                  </v-btn>
                </div>
              </div>
              <div class="tw-mt-10 tab">
                <ul class="d-flex tw-list-none tw-text-left">
                  <li v-for="(item, index) in tabItems" :key="index" @click="setActive(index)">
                    <a :class="{ active: isActive(index) }" :href="`#${item}`"> {{ item }}</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- overview tabs content -->
          <div class="tw-p-4 tw-h-screen tw-overflow-y-auto">
            <div class="tw-my-10 overview" id="Overview">
              <p class="subitle2 tw-pl-10">
                Use your existing security camera infrastructure to enable PPE Compliance at your facility
              </p>
              <div
                class="tw-grid tw-grid-cols-1 md:tw-grid-cols-5 sm:tw-grid-cols-2 xs:tw-grid-cols-3 tw-gap-4 my-10 tw-mt-10"
              >
                <div class="d-flex tw-justify-center tw-items-center">
                  <img src="../../assets/img/ppt20.svg" />
                </div>

                <div class="d-flex tw-justify-center tw-items-center">
                  <img src="../../assets/img/ppt21.svg" />
                </div>

                <div class="d-flex tw-justify-center tw-items-center">
                  <img src="../../assets/img/ppt22.svg" />
                </div>

                <div class="d-flex tw-justify-center tw-items-center">
                  <img src="../../assets/img/ppt23.svg" />
                </div>

                <div class="d-flex tw-justify-center tw-items-center">
                  <img src="../../assets/img/ppt24.svg" />
                </div>
              </div>
            </div>

            <!-- accuracy tab content -->
            <div class="tw-my-10 tw-mx-5 accuracy" id="Accuracy">
              <h3 class="text-xl">Accuracy</h3>
              <v-btn color="var(--cui-primary)" class="tw-text-white tw-font-semibold tw-my-5">
                Model: PPE Detection 2.2.1</v-btn
              >

              <div
                class="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 sm:tw-grid-cols-2 xs:tw-grid-cols-2 tw-gap-4 my-10 tw-mt-10"
              >
                <div>
                  <p class="subtitle2">Dataset : {{ scenario.models.latest.datasetSize }} images</p>
                  <v-chip-group>
                    <v-chip>View Details</v-chip>

                    <v-chip>Coutomize</v-chip>
                  </v-chip-group>
                </div>
                <div class="d-flex tw-justify-between tw-items-center tw-pr-10">
                  <div class="d-flex tw-justify-center tw-flex-col">
                    <v-progress-circular
                      :rotate="-90"
                      :size="100"
                      :width="15"
                      :model-value="scenario.models.latest.accuracy"
                      color="primary"
                    >
                      {{ scenario.models.latest.accuracy }}
                    </v-progress-circular>
                    <h3 class="text-xl tw-text-center">Accuracy</h3>
                  </div>

                  <div class="d-flex tw-justify-center tw-flex-col">
                    <v-progress-circular
                      :rotate="-90"
                      :size="100"
                      :width="15"
                      :model-value="scenario.models.latest.recall"
                      color="primary"
                    >
                      {{ scenario.models.latest.recall }}
                    </v-progress-circular>
                    <h3 class="text-xl text-center">Recall</h3>
                  </div>

                  <div class="d-flex tw-justify-center tw-flex-col">
                    <v-progress-circular
                      :rotate="-90"
                      :size="100"
                      :width="15"
                      :model-value="scenario.models.latest.f1"
                      color="primary"
                    >
                      {{ scenario.models.latest.f1 }}
                    </v-progress-circular>
                    <h3 class="text-xl">F1- Score</h3>
                  </div>
                </div>
              </div>
            </div>

            <!-- events tab content -->
            <div class="tw-my-10 tw-mx-5 events" id="Event">
              <h3 class="text-xl">Events</h3>
              <div>
                <div class="tw-overflow-hidden tw-my-5">
                  <table class="tw-table-auto tw-w-full">
                    <thead class="table-heading">
                      <tr class="tw-text-left">
                        <th class="tw-px-4 tw-py-2 tw-text-white">Event</th>
                        <th class="tw-px-4 tw-py-2 tw-text-white">Schedule</th>
                        <th class="tw-px-4 tw-py-2 tw-text-white">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="n in 5" :key="n" class="tw-bg-emerald-200">
                        <td class="tw-px-4 tw-py-4 tw-text-emerald-600 tw-font-medium">Missing helmet</td>
                        <td class="tw-px-4 tw-py-4 tw-text-emerald-600 tw-font-medium">Immediate</td>
                        <td class="tw-px-4 tw-py-4 tw-text-emerald-600 tw-font-medium">
                          This event is raised when a person is detected without a helmet.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- user manual tab content -->
            <div class="tw-my-10 tw-mx-5" id="User Manual">
              <h3 class="text-xl">User Manual</h3>
              <div class="my-5">
                <p class="subtitle2 my-5">
                  Lorem ipsum dolor sit amet consectetur. A id condimentum nibh eu amet nisi ornare. Sit eu diam proin
                  maecenas. Mattis eget eu etiam urna purus nibh ornare. Lacus eu volutpat vel ligula bibendum
                  suspendisse arcu quis.
                </p>
                <p class="subtitle2 my-5">
                  Lorem ipsum dolor sit amet consectetur. A id condimentum nibh eu amet nisi ornare. Sit eu diam proin
                  maecenas. Mattis eget eu etiam urna purus nibh ornare. Lacus eu volutpat vel ligula bibendum
                  suspendisse arcu quis
                </p>
                <p class="subtitle2 my-5">
                  Lorem ipsum dolor sit amet consectetur. A id condimentum nibh eu amet nisi ornare. Sit eu diam proin
                  maecenas. Mattis eget eu etiam urna purus nibh ornare. Lacus eu volutpat vel ligula bibendum
                  suspendisse arcu quis. Lorem ipsum dolor sit amet consectetur. A id condimentum nibh eu amet nisi
                  ornare. Sit eu diam proin maecenas. Mattis eget eu etiam urna purus nibh ornare. Lacus eu volutpat vel
                  ligula bibendum suspendisse arcu quis. Lorem ipsum dolor sit amet consectetur. A id condimentum nibh
                  eu amet nisi ornare. Sit eu diam proin maecenas. Mattis eget eu etiam urna purus nibh ornare. Lacus eu
                  volutpat vel ligula bibendum suspendisse arcu quis. Lorem ipsum dolor sit amet consectetur. A id
                  condimentum nibh eu amet nisi ornare. Sit eu diam proin maecenas. Mattis eget eu etiam urna purus nibh
                  ornare. Lacus eu volutpat vel ligula bibendum suspendisse arcu quis. Lorem ipsum dolor sit amet
                  consectetur. A id condimentum nibh eu amet nisi ornare. Sit eu diam proin maecenas. Mattis eget eu
                  etiam urna purus nibh ornare. Lacus eu volutpat vel ligula bibendum suspendisse arcu quis.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- simillar section -->
        <div class="tw-w-full md:tw-w-1/4 lg:tw-w-1/3 xl:tw-w-1/4 tw-pl-2 tw-relative">
          <div class="right-section tw-h-screen tw-overflow-y-auto tw-fixed">
            <div class="tw-my-4">
              <h3 class="tw-text-md tw-text-left">You may also need</h3>
            </div>
            <div
              v-for="n in 8"
              :key="n"
              class="tw-my-4 tw-w-96 d-flex tw-justify-between tw-gap-x-5 tw-shadow tw-rounded-mg tw-bg-white tw-p-5"
            >
              <div>
                <img
                  src="https://webapp-msejccxdwi33c.azurewebsites.net/static/media/ppt13.ea14dded036bb30bf8975e410d970505.svg"
                />
              </div>
              <div>
                <h3 class="tw-text-md">{{ scenario.name }}</h3>
                <p class="tw-text-sm">Detect face masks for preventing the spread of COVID-19</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showForm" class="tw-shadow tw-rounded-mg tw-bg-white form">
      <div class="tw-mx-20">
        <h3 class="text-xl tw-text-center tw-py-8">{{ indexForm ? 'Select Camera' : 'Terms & Conditions' }}</h3>

        <div class="stepper-card-bg-white">
          <div class="scroll-bg-gray tw-my-30">
            <div v-if="!indexForm">
              <p class="tw-my-10">
                Lorem ipsum dolor sit amet consectetur. A id condimentum nibh eu amet nisi ornare. Sit eu diam proin
                maecenas. Mattis eget eu etiam urna purus nibh ornare. Lacus eu volutpat vel ligula bibendum suspendisse
                arcu quis. Lorem ipsum dolor sit amet consectetur. A id condimentum nibh eu amet nisi ornare. Sit eu
                diam proin maecenas. Mattis eget eu etiam urna purus nibh ornare. Lacus eu volutpat vel ligula bibendum
                suspendisse arcu quis. Lorem ipsum dolor sit amet consectetur. A id condimentum nibh eu amet nisi
                ornare. Sit eu diam proin maecenas. Mattis eget eu etiam urna purus nibh ornare. Lacus eu volutpat vel
                ligula bibendum suspendisse arcu quis. Lorem ipsum dolor sit amet consectetur. A id condimentum nibh eu
                amet nisi ornare. Sit eu diam proin maecenas. Mattis eget eu etiam urna purus nibh ornare. Lacus eu
                volutpat vel ligula bibendum suspendisse arcu quis. Lorem ipsum dolor sit amet consectetur. A id
                condimentum nibh eu amet nisi ornare. Sit eu diam proin maecenas. Mattis eget eu etiam urna purus nibh
                ornare. Lacus eu volutpat vel ligula bibendum suspendisse arcu quis.
              </p>
              <p class="tw-my-10">
                Lorem ipsum dolor sit amet consectetur. A id condimentum nibh eu amet nisi ornare. Sit eu diam proin
                maecenas. Mattis eget eu etiam urna purus nibh ornare. Lacus eu volutpat vel ligula bibendum suspendisse
                arcu quis. Lorem ipsum dolor sit amet consectetur. A id condimentum nibh eu amet nisi ornare. Sit eu
                diam proin maecenas. Mattis eget eu etiam urna purus nibh ornare. Lacus eu volutpat vel ligula bibendum
                suspendisse arcu quis. Lorem ipsum dolor sit amet consectetur. A id condimentum nibh eu amet nisi
                ornare. Sit eu diam proin maecenas. Mattis eget eu etiam urna purus nibh ornare. Lacus eu volutpat vel
                ligula bibendum suspendisse arcu quis. Lorem ipsum dolor sit amet consectetur. A id condimentum nibh eu
                amet nisi ornare. Sit eu diam proin maecenas. Mattis eget eu etiam urna purus nibh ornare. Lacus eu
                volutpat vel ligula bibendum suspendisse arcu quis. Lorem ipsum dolor sit amet consectetur. A id
                condimentum nibh eu amet nisi ornare. Sit eu diam proin maecenas. Mattis eget eu etiam urna purus nibh
                ornare. Lacus eu volutpat vel ligula bibendum suspendisse arcu quis.
              </p>
              <p class="tw-my-10">
                Lorem ipsum dolor sit amet consectetur. A id condimentum nibh eu amet nisi ornare. Sit eu diam proin
                maecenas. Mattis eget eu etiam urna purus nibh ornare. Lacus eu volutpat vel ligula bibendum suspendisse
                arcu quis. Lorem ipsum dolor sit amet consectetur. A id condimentum nibh eu amet nisi ornare. Sit eu
                diam proin maecenas. Mattis eget eu etiam urna purus.
              </p>
              <p class="tw-my-10">
                Lorem ipsum dolor sit amet consectetur. A id condimentum nibh eu amet nisi ornare. Sit eu diam proin
                maecenas. Mattis eget eu etiam urna purus nibh ornare. Lacus eu volutpat vel ligula bibendum suspendisse
                arcu quis. Lorem ipsum dolor sit amet consectetur. A id condimentum nibh eu amet nisi ornare. Sit eu
                diam proin maecenas. Mattis eget eu etiam urna purus.
              </p>
            </div>

            <div v-if="indexForm">
              <v-row>
                <v-col v-for="n in 12" :key="n" cols="12" sm="12" xs="12" md="6" lg="4" xl="3">
                  <div>
                    <img
                      src="https://webapp-msejccxdwi33c.azurewebsites.net/static/media/ppt30.a9ece9fcf7f37e505527f7fc420bcbc3.svg"
                      class="camera-img"
                      alt=""
                    />
                  </div>
                </v-col>
              </v-row>
            </div>
          </div>
        </div>
      </div>
      <div class="d-flex tw-justify-center tw-mt-8">
        <v-btn
          v-if="!indexForm"
          size="x-large"
          color="var(--cui-primary)"
          class="tw-text-white tw-font-semibold"
          @click="indexForm = true"
        >
          Accept
        </v-btn>

        <v-btn
          v-if="indexForm"
          size="x-large"
          color="var(--cui-primary)"
          class="tw-text-white tw-font-semibold"
          @click="submitCamera"
        >
          Select For Camera
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script>
import data from '../../assets/scenarios-override.json';

export default {
  name: 'ScenarioDetail',

  beforeRouteLeave(to, from, next) {
    this.loading = true;
    next();
  },

  data() {
    return {
      loading: true,
      scenario: {},
      activeIndex: 0,
      tabItems: ['Overview', 'Accuracy', 'Event', 'User Manual'],
      showForm: false,
      indexForm: false,
    };
  },

  mounted() {
    this.loading = false;
    const scenario = data.scenarios.find((item) => item.id === this.$route.params.id);
    this.scenario = scenario;
  },

  methods: {
    setActive(index) {
      this.activeIndex = index;
    },
    isActive(index) {
      return index === this.activeIndex;
    },
    submitCamera() {},
  },
};
</script>

<style scoped>
.scenario-img img {
  width: 100%;
}
.scenario-wrapper {
  position: relative;
}
.scenario-detail-top {
  background: var(--cui-bg-app-bar);
  z-index: 1;
}

.tab {
  border-bottom: 1px solid #cbc4c4;
  height: 60px;
  line-height: 50px;
  width: 100%;
}

.tab ul li a {
  color: #183153;
  padding: 20px 20px;
  text-decoration: none;
  font-size: 1rem;
}

.tab ul li a:hover {
  color: var(--cui-primary);
  border-bottom: 2px solid var(--cui-primary);
}

.tab ul li a.active {
  color: var(--cui-primary);
  border-bottom: 2px solid var(--cui-primary);
}

.overview,
.accuracy,
.events {
  border-bottom: 1px solid #cbc4c4;
}

.table-heading {
  background: var(--cui-primary);
}

.form {
  margin: 100px 50px;
}

.form .scroll-bg-gray {
  background: #f8f8f8;
  padding: 15px 30px;
  padding-top: 50px;
  height: 400px;
  overflow-y: scroll;
}
.form .stepper-card-bg-white {
  background: #fff;
  padding: 20px;
}
.camera-img {
  width: 100%;
}
</style>
