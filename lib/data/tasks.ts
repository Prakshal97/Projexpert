export interface Task {
  id: string
  title: string
  description: string
  progress: number
  status: "locked" | "available" | "in-progress" | "completed"
  instructions: string
  starterFiles: {
    name: string
    content: string
    language: string
  }[]
}

export const INTERNSHIP_TASKS: Task[] = [
  {
    id: "task-1",
    title: "1. Build a Landing Page",
    description: "Create a simple landing page for a new product using HTML and CSS.",
    progress: 100,
    status: "completed",
    instructions: "Your first task is to build a modern landing page. Follow these steps:\n\n1. Setup the basic HTML structure in `index.html`.\n2. Add styling in `styles.css` using Flexbox for the layout.\n3. Ensure the active preview looks identical to the provided design specs.",
    starterFiles: [
      {
        name: "index.html",
        language: "html",
        content: "<!DOCTYPE html>\n<html>\n<head>\n  <title>Landing Page</title>\n</head>\n<body>\n  <h1>Welcome to our Product</h1>\n</body>\n</html>"
      }
    ]
  },
  {
    id: "task-2",
    title: "2. Interactive JavaScript Logic",
    description: "Add a working interactive modal when a button is clicked.",
    progress: 30,
    status: "in-progress",
    instructions: "Now that we have a landing page, we need to add interactions.\n\n1. Add a button to your HTML.\n2. Create a `script.js` file.\n3. Write an event listener that opens a modal when the button is clicked.\n4. Complete the task and hit 'Submit AI Review' to get feedback from the Senior Dev.",
    starterFiles: [
      {
        name: "index.html",
        language: "html",
        content: "<!DOCTYPE html>\n<html>\n<head>\n  <title>Landing Page</title>\n</head>\n<body>\n  <h1>Welcome to our Product</h1>\n  <button id='openModal'>Learn More</button>\n</body>\n</html>"
      },
      {
        name: "script.js",
        language: "javascript",
        content: "document.getElementById('openModal').addEventListener('click', () => {\n  // TODO: Add modal open logic\n});"
      }
    ]
  },
  {
    id: "task-3",
    title: "3. API Integration",
    description: "Fetch data from an API and display it dynamically on the page.",
    progress: 0,
    status: "available",
    instructions: "Fetch data from `https://jsonplaceholder.typicode.com/users` and display it.",
    starterFiles: []
  },
  {
    id: "task-4",
    title: "4. Database Schema Design",
    description: "Design the MongoDB Schema for user profiles.",
    progress: 0,
    status: "locked",
    instructions: "Create the Mongoose schema for the user profiles.",
    starterFiles: []
  }
]
