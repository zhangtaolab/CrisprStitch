<template>
  <div class="echarts" ref="deletion-chart" style="width: 80%"></div>
</template>

<script setup lang="ts">
import { watch, PropType, ref } from 'vue';
import { init } from 'echarts';

const chartDiv = ref();

interface Data {
  xaxis: string[];
  data: number[];
  name: string;
  error: number[][] | undefined;
}

const props = defineProps({
  data: {
    type: Object as PropType<Data>,
    required: true,
  },
});

watch(
  () => props.data,
  () => {
    const chartInstance = init(chartDiv.value, undefined, {
      renderer: 'svg',
    });
    const option = {
      color: ['black'],
      title: {
        text: name,
        left: 'center',
      },
      animation: false,
      tooltip:
        props.data.error != undefined
          ? {
              trigger: 'axis',
              axisPointer: {
                type: 'shadow',
              },
              formatter: function (param: any) {
                const bar = param[0];
                const error = param[1];
                return `
          avg: ${bar.data}
          error: ${error.data[1] - bar.data}
          `;
              },
            }
          : {
              trigger: 'axis',
              axisPointer: {
                type: 'shadow',
              },
              formatter: function (param: any) {
                const bar = param[0];
                return `
          value: ${bar.data}
          `;
              },
            },
      xAxis: {
        axisLabel: {
          interval: 0,
          show: true,
          textStyle: {
            fontSize: 14,
            color: 'black',
          },
        },
        data: props.data.xaxis,
        axisTick: {
          alignWithLabel: true,
        },
      },
      yAxis: {
        nameLocation: 'middle',
        nameGap: 50,
        nameTextStyle: {
          fontSize: 14,
          color: 'black',
        },
        axisLabel: {
          show: true,
          textStyle: {
            fontSize: 14,
            color: 'black',
          },
        },
        name: props.data.name.endsWith('Size') ? 'count' : 'percentage',
      },
      grid: {
        left: '5%',
        right: '5%',
        bottom: '5%',
      },
      series:
        props.data.error === undefined
          ? [
              {
                data: props.data.data,
                type: 'bar',
                name: 'bar',
                areaStyle: {
                  color: props.data.name.endsWith('Size')
                    ? 'rgb(239, 148, 118)'
                    : 'rgb(152, 235, 232)',
                },
                itemStyle: {
                  color: props.data.name.endsWith('Size')
                    ? 'rgb(249, 165, 19)'
                    : 'rgb(88, 202, 224)',
                },
                smooth: true,
              },
            ]
          : [
              {
                data: props.data.data,
                type: 'bar',
                name: 'bar',
                areaStyle: {
                  color: props.data.name.endsWith('Size')
                    ? 'rgb(239, 148, 118)'
                    : 'rgb(152, 235, 232)',
                },
                itemStyle: {
                  color: props.data.name.endsWith('Size')
                    ? 'rgb(249, 165, 19)'
                    : 'rgb(88, 202, 224)',
                },
                smooth: true,
              },
              {
                type: 'custom',
                name: 'error',
                itemStyle: {
                  borderWidth: 1.5,
                },
                renderItem: function (params: any, api: any) {
                  const xValue = params.dataIndex;
                  const highPoint = api.coord([xValue, api.value(1)]);
                  const lowPoint = api.coord([xValue, api.value(2)]);
                  const halfWidth = (api.size([1, 0]) as number[])[0] * 0.2;
                  const style = api.style({
                    stroke: api.visual('color') as string,
                    fill: undefined,
                    color: props.data.name.endsWith('Size')
                      ? 'rgb(249, 165, 19)'
                      : 'rgb(88, 202, 224)',
                  });

                  return {
                    type: 'group',
                    children: [
                      {
                        type: 'line',
                        transition: ['shape'],
                        shape: {
                          x1: highPoint[0] - halfWidth,
                          y1: highPoint[1],
                          x2: highPoint[0] + halfWidth,
                          y2: highPoint[1],
                        },
                        style: style,
                      },
                      {
                        type: 'line',
                        transition: ['shape'],
                        shape: {
                          x1: highPoint[0],
                          y1: highPoint[1],
                          x2: lowPoint[0],
                          y2: lowPoint[1],
                        },
                        style: style,
                      },
                      {
                        type: 'line',
                        transition: ['shape'],
                        shape: {
                          x1: lowPoint[0] - halfWidth,
                          y1: lowPoint[1],
                          x2: lowPoint[0] + halfWidth,
                          y2: lowPoint[1],
                        },
                        style: style,
                      },
                    ],
                  };
                },
                encode: {
                  x: 0,
                  y: [1, 2],
                },
                data: props.data.error,
                z: 100,
              },
              {
                type: 'line',
                smooth: true,
                data: props.data.error.map((val) => val[2]),
                lineStyle: {
                  width: 0,
                },
                symbolSize: 0,
              },
            ],
    };
    option && chartInstance.setOption(option);
    window.addEventListener('resize', () => {
      chartInstance.resize();
    });
  }
);
</script>
