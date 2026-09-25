import React from "react";
import { Metadata } from "next";
import AICameraWorkout from "@/components/camera/AICameraWorkout";
import { getAllStudentsSummary } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Camera Workout & Form Monitoring",
  description:
    "Live computer vision workout monitoring with real-time posture correction, rep counting, and audio AI assistance.",
};

interface WorkoutPageProps {
  searchParams?: {
    studentId?: string;
  };
}

export default async function WorkoutPage({ searchParams }: WorkoutPageProps) {
  const students = await getAllStudentsSummary();

  return (
    <AICameraWorkout
      students={students}
      initialStudentId={searchParams?.studentId}
    />
  );
}
