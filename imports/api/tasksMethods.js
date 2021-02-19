import { check } from 'meteor/check';
import { TasksCollection } from '../db/TasksCollection';
 
Meteor.methods({
  'tasks.insert'(text) {
    check(text, String);
 
    if (!this.userId) {
      throw new Meteor.Error('Not authorized.');
    }
 
    TasksCollection.insert({
      text,
      createdAt: new Date,
      userId: this.userId,
    })
  },
 
  'tasks.remove'(taskId) {
    check(taskId, String);

    if (!this.userId) {
      throw new Meteor.Error('Not authorized.');
    }

    // makes sure that only authenticated user can delete task
    // if user id in task object and user id in fn call don't match task is falsy
    // in this case conditional will fire and throw an exception
    const task = TasksCollection.findOne({ _id: taskId, userId: this.userId });

    if (!task) {
      throw new Meteor.Error('Access denied.');
    }

    TasksCollection.remove(taskId);
  },

  'tasks.setIsChecked'(taskId, isChecked) {
    check(taskId, String);
    check(isChecked, Boolean);

    if (!this.userId) {
      throw new Meteor.Error('Not authorized.');
    }

     // makes sure that only authenticated user can check task
    // if user id in task object and user id in fn call don't match task is falsy
    // in this case conditional will fire and throw an exception
    const task = TasksCollection.findOne({ _id: taskId, userId: this.userId });

    if (!task) {
      throw new Meteor.Error('Access denied.');
    }
 
    TasksCollection.update(taskId, {
      $set: {
        isChecked
      }
    });
  }
});