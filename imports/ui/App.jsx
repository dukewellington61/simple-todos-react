import { Meteor } from "meteor/meteor";
import React, { useState, Fragment } from "react";
import { useTracker } from "meteor/react-meteor-data";
import { TasksCollection } from "/imports/db/TasksCollection";
import { Task } from "./Task";
import { TaskForm } from "./TaskForm";
import { LoginForm } from "./LoginForm";

export const App = () => {
  const [hideCompleted, setHideCompleted] = useState(false);

  // $ne selects the documents where the value of the field is not equal to the specified value.
  // creates query operator which returns all db entries with isChecked === false
  // this query operator is used when only db entries are needed, that are unchecked/incomplete
  const hideCompletedFilter = { isChecked: { $ne: true } };

  const user = useTracker(() => Meteor.user());

  const userFilter = user ? { userId: user._id } : {};

  // merges "unchecked/incomplete tasks" and "logged in user" query operators into a new query operator
  const pendingOnlyFilter = { ...hideCompletedFilter, ...userFilter };

  // if no user: returns object with empty tasks array and pendingTasksCount === 0
  // if subscription isn't ready it returns object with empty tasks array and pendingTasksCount: 0 and isLoading: true
  // if user && subscription is ready it returns objects with tasks array and pendingTasksCount
  const { tasks, pendingTasksCount, isLoading } = useTracker(() => {
    const noDataAvailable = { tasks: [], pendingTasksCount: 0 };
    if (!Meteor.user()) {
      return noDataAvailable;
    }
    const handler = Meteor.subscribe("tasks");

    if (!handler.ready()) {
      return { ...noDataAvailable, isLoading: true };
    }

    // depending on state of button "hide completed", returns either all tasks or only the pending tasks of the logged in user
    // by using the pendingOnlyFilter query operator
    const tasks = TasksCollection.find(
      hideCompleted ? pendingOnlyFilter : userFilter,
      {
        sort: { createdAt: -1 },
      }
    ).fetch();

    const pendingTasksCount = TasksCollection.find(pendingOnlyFilter).count();

    return { tasks, pendingTasksCount };
  });

  const toggleChecked = ({ _id, isChecked }) =>
    Meteor.call("tasks.setIsChecked", _id, !isChecked);

  const deleteTask = ({ _id }) => Meteor.call("tasks.remove", _id);

  // no 0 is displayed if there are no pending tasks
  const pendingTasksTitle = `${
    pendingTasksCount ? ` (${pendingTasksCount})` : ""
  }`;

  const logout = () => Meteor.logout();

  return (
    <Fragment>
      {" "}
      <div className="app">
        <header>
          <div className="app-bar">
            <div className="app-header">
              <h1>📝️ To Do List {pendingTasksTitle}</h1>
            </div>
          </div>
        </header>
        <div className="user" onClick={logout}>
          {user && user.username} 🚪
        </div>

        <div className="main">
          {user ? (
            <Fragment>
              <TaskForm />

              <div className="filter">
                <button onClick={() => setHideCompleted(!hideCompleted)}>
                  {hideCompleted ? "Show All" : "Hide Completed"}
                </button>
              </div>

              {isLoading && <div className="loading">loading...</div>}

              <ul className="tasks">
                {tasks.map((task) => (
                  <Task
                    key={task._id}
                    task={task}
                    onCheckboxClick={toggleChecked}
                    onDeleteClick={deleteTask}
                  />
                ))}
              </ul>
            </Fragment>
          ) : (
            <LoginForm />
          )}
        </div>
      </div>
    </Fragment>
  );
};
