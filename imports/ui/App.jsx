import React, { useState, Fragment } from "react";
import { useTracker } from "meteor/react-meteor-data";
import { TasksCollection } from "/imports/api/TasksCollection";
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

  // if user exists, this fn returns, depending on state of button hide completed, either all tasks or only the pending tasks of the logged in user
  // by using the pendingOnlyFilter query operator
  const tasks = useTracker(() => {
    if (!user) {
      return [];
    }

    return TasksCollection.find(
      hideCompleted ? pendingOnlyFilter : userFilter,
      {
        sort: { createdAt: -1 },
      }
    ).fetch();
  });

  const toggleChecked = ({ _id, isChecked }) => {
    TasksCollection.update(_id, {
      $set: {
        isChecked: !isChecked,
      },
    });
  };

  const deleteTask = ({ _id }) => TasksCollection.remove(_id);

  const pendingTasksCount = useTracker(() => {
    if (!user) {
      return 0;
    }
    return TasksCollection.find(pendingOnlyFilter).count();
  });

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
              <TaskForm user={user} />

              <div className="filter">
                <button onClick={() => setHideCompleted(!hideCompleted)}>
                  {hideCompleted ? "Show All" : "Hide Completed"}
                </button>
              </div>

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
