<template>
    <Bar
        id="revenue-chart"
        :options="chartOptions"
        :data="{
            labels: labels,
            datasets: datasets
        }" 
    />
</template>

<script>
import { Bar } from 'vue-chartjs';
import { 
    Chart as ChartJS, 
    Title, 
    Tooltip, 
    Legend, 
    BarElement, 
    CategoryScale, 
    LinearScale }
    from 'chart.js'

ChartJS.register(
    Title, 
    Tooltip, 
    Legend, 
    BarElement, 
    CategoryScale, 
    LinearScale)

export default {
  name: 'BarChart',
  components: { Bar },
    props: {
        labels: Array,
        datasets: Array
    },
    setup() {
        return {
            chartOptions: {
                responsive: true,
                scales: {
                    y: {
                        suggestedMin: 0,
                        suggestedMax: 5
                    }
                },
                ticks: {
                    stepSize: 1
                },
                maintainAspectRatio: false
            }
        }
    }
}
</script>