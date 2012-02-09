// An example Backbone application contributed by
// [Jérôme Gravel-Niquet](http://jgn.me/). This demo uses a simple
// [LocalStorage adapter](backbone-localstorage.html)
// to persist Backbone models within your browser.

// Load the application once the DOM is ready, using `jQuery.ready`:
$(function(){

  // Todo Model
  // ----------

  // Our basic **Todo** model has `text`, `order`, and `done` attributes.
  window.Todo = Backbone.Model.extend();

  // Todo Collection
  // ---------------

  // The collection of todos is backed by *localStorage* instead of a remote
  // server.
  window.TodoList = Backbone.Collection.extend({

    // Reference to this collection's model.
    model: Todo,

    // Save all of the todo items under the `"todos"` namespace.
    localStorage: new Store("stories"),

    // Todos are sorted by agent
    comparator: function(todo) {
      return todo.get('agent');
    }

  });

  // Create our global collection of **Todos**.
  window.Todos = new TodoList;

  // Todo Item View
  // --------------

  // The DOM element for a todo item...
  window.TodoView = Backbone.View.extend({

    //... is a list tag.
    tagName:  "li",

    // Cache the template function for a single item.
    template: _.template($('#item-template').html()),

    // The DOM events specific to an item.
    events: {
      "click .display" : "edit",
      "click span.todo-destroy" : "clear",
      "keypress .todo-input-agent" : "updateOnEnter",
      "keypress .todo-input-action" : "updateOnEnter",
      "keypress .todo-input-result" : "updateOnEnter"
    },

    // The TodoView listens for changes to its model, re-rendering.
    initialize: function() {
      this.model.bind('change', this.render, this);
      this.model.bind('destroy', this.remove, this);
    },

    // Re-render the contents of the todo item.
    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      this.setText();
      return this;
    },

    // To avoid XSS (not that it would be harmful in this particular app),
    // we use `jQuery.text` to set the contents of the todo item.
    setText: function() {
      var agent = this.model.get('agent');
      var action = this.model.get('action');
      var result = this.model.get('result');
      this.$('.todo-text-agent').text(agent);
      this.$('.todo-text-action').text(action);
      this.$('.todo-text-result').text(result);
      this.inputAgent = this.$('.todo-input-agent');
      this.inputAction = this.$('.todo-input-action');
      this.inputResult = this.$('.todo-input-result');
      
      // this.inputAgent.bind('blur', _.bind(this.close, this)).val(agent);
      // this.inputAction.bind('blur', _.bind(this.close, this)).val(action);
      // this.inputResult.bind('blur', _.bind(this.close, this)).val(result);

      this.inputAgent.val(agent);
      this.inputAction.val(action);
      this.inputResult.val(result);

    },

    // Switch this view into `"editing"` mode, displaying the input field.
    edit: function() {
      $(this.el).addClass("editing");
      this.inputAgent.focus();
    },

    // Close the "editing" mode, saving changes to the todo.
    close: function() {
      this.model.save({
        agent: this.inputAgent.val(),
        action: this.inputAction.val(),
        result: this.inputResult.val()
      });
      $(this.el).removeClass("editing");
    },

    // If you hit "enter", we're through editing the item.
    updateOnEnter: function(e) {
      if (e.keyCode == 13) this.close();
    },

    // Remove this view from the DOM.
    remove: function() {
      $(this.el).remove();
    },

    // Remove the item, destroy the model.
    clear: function() {
      this.model.destroy();
    }

  });

  // The Application
  // ---------------

  // Our overall **AppView** is the top-level piece of UI.
  window.AppView = Backbone.View.extend({

    // Instead of generating a new element, bind to the existing skeleton of
    // the App already present in the HTML.
    el: $("#todoapp"),

    // Our template for the line of statistics at the bottom of the app.
    statsTemplate: _.template($('#stats-template').html()),

    // Delegated events for creating new items, and clearing completed ones.
    events: {
      "keypress #new-story-agent": "createOnEnter",
      "keypress #new-story-action": "createOnEnter",
      "keypress #new-story-result": "createOnEnter"
    },

    // At initialization we bind to the relevant events on the `Todos`
    // collection, when items are added or changed. Kick things off by
    // loading any preexisting todos that might be saved in *localStorage*.
    initialize: function() {
      this.inputAgent = this.$("#new-story-agent");
      this.inputAction = this.$("#new-story-action");
      this.inputResult = this.$("#new-story-result");

      Todos.bind('add',   this.addOne, this);
      Todos.bind('reset', this.addAll, this);
      Todos.bind('all',   this.render, this);

      Todos.fetch();
    },

    // Re-rendering the App just means refreshing the statistics -- the rest
    // of the app doesn't change.
    render: function() {
      this.$('#todo-stats').html(this.statsTemplate({
        total:      Todos.length
      }));
    },

    // Add a single todo item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function(todo) {
      var view = new TodoView({model: todo});
      $("#todo-list").append(view.render().el);
    },

    // Add all items in the **Todos** collection at once.
    addAll: function() {
      Todos.each(this.addOne);
    },

    // If you hit return in the main input field, and there is text to save,
    // create new **Todo** model persisting it to *localStorage*.
    createOnEnter: function(e) {
      var textAgent = this.inputAgent.val();
      var textAction = this.inputAction.val();
      var textResult = this.inputResult.val();
      if ((!textAgent && !textAction) || e.keyCode != 13) return;
      Todos.create({
        agent: textAgent,
        action: textAction,
        result: textResult
      });
      this.inputAgent.val('');
      this.inputAction.val('');
      this.inputResult.val('');
    }

  });

  // Finally, we kick things off by creating the **App**.
  window.App = new AppView;

});
