const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

/**
 * User operations
 */

function createUser(name, username) {
  const user = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };

  users.push(user);

  return user;
}

/**
 * Todo operations
 */

function createTodo(user, { title, deadline }) {
  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  user.todos.push(todo);

  return todo;
}

function updateTodo(todo, { title, deadline, done }) {
  todo.title = title ?? todo.title;
  todo.deadline = deadline ? new Date(deadline) : todo.deadline;
  todo.done = done ?? todo.done;

  return todo;
}

function deleteTodo(user, todo) {
  user.todos = user.todos.filter((todoItem) => todoItem.id !== todo.id);
}

/**
 * Middlewares
 */

function checkUserAccountExists(request, response, next) {
  const { username } = request.headers;

  const user = users.find((user) => user.username === username);

  if (!user) {
    return response.status(404).json({
      error: 'User not found.',
    });
  }

  request.user = user;
  next();
}

function checkTodoExists(request, response, next) {
  const { user } = request;
  const { id: todoId } = request.params;

  const todo = user.todos.find((todo) => todo.id === todoId);

  if (!todo) {
    return response.status(404).json({
      error: 'Todo not found.',
    });
  }

  request.todo = todo;
  next();
}

/**
 * Endpoints
 */

app.get('/users', (request, response) => {
  response.json(users);
});

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  const isUsernameTaken = users.some((user) => user.username === username);

  if (isUsernameTaken) {
    return response.status(400).json({
      error: 'User with this Username already exists.',
    });
  }

  const user = createUser(name, username);

  response.status(201).json(user);
});

app.get('/todos', checkUserAccountExists, (request, response) => {
  const { user } = request;

  response.json(user.todos);
});

app.post('/todos', checkUserAccountExists, (request, response) => {
  const { user } = request;
  const data = request.body;

  if (data.title === undefined || data.deadline === undefined) {
    return response.status(400).json({
      error: 'Missing parameter.',
    });
  }

  const todo = createTodo(user, data);

  response.status(201).json(todo);
});

app.put('/todos/:id', checkUserAccountExists, checkTodoExists, (request, response) => {
  const { todo } = request;
  const updatedData = request.body;

  updateTodo(todo, updatedData)

  response.status(201).json(todo);
});

app.patch('/todos/:id/done', checkUserAccountExists, checkTodoExists, (request, response) => {
  const { todo } = request;
  
  updateTodo(todo, { done: true })

  response.json(todo);
});

app.delete('/todos/:id', checkUserAccountExists, checkTodoExists, (request, response) => {
  const { user, todo } = request;

  deleteTodo(user, todo);

  response.status(204).json();
});

module.exports = app;