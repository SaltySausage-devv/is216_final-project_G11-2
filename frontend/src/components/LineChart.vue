<template>
    <Line
        id="revenue-chart"
        :options="chartOptions"
        :data="{
            labels: labels,
            datasets: datasets
        }" 
    />
</template>

<script>
import { Line } from 'vue-chartjs'
import { 
    Chart as ChartJS, 
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
)

export default {
    name: 'LineChart',
    components: { Line },
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
                        suggestedMin: 0.0
                    }
                }
            }
        }
    }
}
</script>