<template>
  <br />
  <q-card>
    <div class="echarts" id="echarts"></div>
    <div id="alignment-result"></div>
    <div align="center">
      <q-btn flat color="secondary" @click="download">Save chart</q-btn>
      <q-btn flat color="secondary" @click="saveTXT(alignmentResult)"
        >Save as txt</q-btn
      >
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { nextTick, onMounted } from 'vue';
import * as echarts from 'echarts';
import { AlignmentResult } from 'src/utils/alignment';
import { multialign } from 'src/stores/interface';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = pdfFonts.pdfMake.vfs;

const props = defineProps({
  type: {
    type: String,
    required: true,
  },
  chartData: {
    type: Object,
    required: true,
  },
  alignmentResult: {
    type: Array<multialign>,
    required: true,
  },
});

let chartIns: echarts.ECharts;

onMounted(() => {
  chartIns = echarts.init(
    document.getElementById('echarts') as HTMLElement,
    undefined,
    { renderer: 'svg' }
  );
  resetChart();
});

function resetChart() {
  // chart option
  chartPreparation(
    props.type,
    props.chartData.xaxis,
    props.chartData.bar,
    props.chartData.errorbar,
    chartIns
  );
  // alignment result
  new AlignmentResult().draw(props.alignmentResult, props.type);
}

function download() {
  pdfMake
    .createPdf({
      content: [{ svg: chartIns.renderToSVGString() }],
      pageSize: { width: 1200, height: 'auto' },
    })
    .download();
}

function chartPreparation(
  name: string,
  xaxis: any[],
  data: number[],
  error: number[][] | undefined,
  chartIns: echarts.ECharts
) {
  let option = {
    color: ['black'],
    animation: false,
    tooltip:
      error != undefined
        ? {
            trigger: 'axis',
            axisPointer: {
              type: 'shadow',
            },
            formatter: function (param: any) {
              const bar = param[0];
              const error = param[1];
              return `
                avg: ${bar.data.toFixed(2)}
                error: ${error.data[1] - bar.data.toFixed(2)}
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
                value: ${bar.data.toFixed(2)}
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
      data: xaxis,
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
      name: name.endsWith('Size') ? 'count' : 'percentage',
    },
    grid: {
      left: '5%',
      right: '5%',
      bottom: '5%',
    },
    series:
      error === undefined
        ? [
            {
              data: data,
              type: 'bar',
              name: 'bar',
              areaStyle: {
                color: name.endsWith('Size')
                  ? 'rgb(239, 148, 118)'
                  : 'rgb(152, 235, 232)',
              },
              itemStyle: {
                color: name.endsWith('Size')
                  ? 'rgb(249, 165, 19)'
                  : 'rgb(88, 202, 224)',
              },
              smooth: true,
            },
          ]
        : [
            {
              data: data,
              type: 'bar',
              name: 'bar',
              areaStyle: {
                color: name.endsWith('Size')
                  ? 'rgb(239, 148, 118)'
                  : 'rgb(152, 235, 232)',
              },
              itemStyle: {
                color: name.endsWith('Size')
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
                  color: name.endsWith('Size')
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
              data: error,
              z: 100,
            },
            {
              type: 'line',
              smooth: true,
              data: error.map((val) => val[2]),
              lineStyle: {
                width: 0,
              },
              symbolSize: 0,
            },
          ],
  };
  option && chartIns.setOption(option);
  nextTick(() => {
    chartIns.resize();
  });
  new ResizeObserver(() => {
    chartIns.resize();
  }).observe(document.getElementById('echarts') as HTMLElement);
}

function saveTXT(res: multialign[]) {
  function multiAlignResToString(res: multialign, windowSize = 30) {
    let result = '';
    result += `${'-'.repeat(windowSize)}${res.sample.gRNA_PAM}${'-'.repeat(
      windowSize
    )}\n`;
    result += `${res.sample.ref}\n`;
    for (const line of res.res) {
      result += `${line.query} count: ${line.count} `;
      if (line.insertions.length > 0) {
        result += 'insertions: {';
        for (const insertion of line.insertions) {
          result += `index: ${insertion.index} sequence: ${insertion.sequence} `;
        }
        result += '}';
      }
      result += '\n';
    }
    return result;
  }
  for (const re of res) {
    const element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:text/plain;charset=utf-8,' +
        encodeURIComponent(multiAlignResToString(re))
    );
    element.setAttribute('download', re.sample.name);
    element.style.display = 'none';
    element.click();
  }
}

defineExpose({
  resetChart,
});
</script>

<style>
.echarts {
  width: 80%;
  height: 600px;
}
</style>
