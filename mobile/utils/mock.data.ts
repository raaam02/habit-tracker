import { Habit } from "@/types/habit";
import { User } from "@/types/user";

export const MOCK_HABITS: Habit[] = [
  { 
    id: 1, 
    name: "Morning Run", 
    streak: 12, 
    icon: "walk-outline",
    color: "bg-emerald-100",
    iconColor: "#059669",
    done: true 
  },
  {
    id: 2,
    name: "Read 30 mins",
    streak: 5,
    icon: "book-outline",
    color: "bg-gray-100",
    iconColor: "#475569",
    done: false
  },
  {
    id: 3,
    name: "Drink Water",
    streak: 21,
    icon: "water-outline",
    color: "bg-blue-100",
    iconColor: "#2563EB",
    done: true
  },
  {
    id: 4,
    name: "Meditation",
    streak: 45,
    icon: "flower-outline",
    color: "bg-violet-100",
    iconColor: "#7C3AED",
    done: false
  },
];

export const MOCK_USER: User = {
  id: 1,
  name: "Alex Mitchell",
  email: "alex.mitchell@example.com",
  avatar: "https://i.pravatar.cc/150?img=5",
};