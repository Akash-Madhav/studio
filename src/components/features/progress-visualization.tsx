
"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const weightChartData = [
  { month: "January", weight: 186 },
  { month: "February", weight: 305 },
  { month: "March", weight: 237 },
  { month: "April", weight: 73 },
  { month: "May", weight: 209 },
  { month: "June", weight: 214 },
];

const weightChartConfig = {
  weight: {
    label: "Weight (kg)",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const cardioChartData = [
  { month: "January", minutes: 30 },
  { month: "February", minutes: 45 },
  { month: "March", minutes: 35 },
  { month: "April", minutes: 50 },
  { month: "May", minutes: 60 },
  { month: "June", minutes: 55 },
];

const cardioChartConfig = {
  minutes: {
    label: "Minutes",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig;

const repsChartData = [
  { exercise: "Push-ups", reps: 45 },
  { exercise: "Squats", reps: 60 },
  { exercise: "Pull-ups", reps: 15 },
  { exercise: "Lunges", reps: 40 },
  { exercise: "Plank (s)", reps: 90 },
];

const repsChartConfig = {
  reps: {
    label: "Reps",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export default function ProgressVisualization() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Weight Lifted Progress</CardTitle>
          <CardDescription>Total weight lifted per month</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={weightChartConfig}>
            <BarChart accessibilityLayer data={weightChartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dashed" />}
              />
              <Bar dataKey="weight" fill="var(--color-weight)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Cardio Duration</CardTitle>
          <CardDescription>Average cardio duration per month</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={cardioChartConfig}>
            <LineChart
              accessibilityLayer
              data={cardioChartData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Line
                dataKey="minutes"
                type="natural"
                stroke="var(--color-minutes)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Max Reps per Exercise</CardTitle>
          <CardDescription>Your personal bests</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={repsChartConfig}>
            <BarChart
              accessibilityLayer
              layout="vertical"
              data={repsChartData}
              margin={{ left: 10 }}
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="exercise"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                className="w-20"
              />
              <XAxis dataKey="reps" type="number" hide />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dashed" />}
              />
              <Bar dataKey="reps" fill="var(--color-reps)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
