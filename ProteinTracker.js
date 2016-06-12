ProteinData = new Meteor.Collection('protien_data');
History = new Meteor.Collection('history');

ProteinData.deny({    
    update: function(userId, data) {
        if (data.total < 0)
            return true;
        return false;
    }
});

Meteor.methods({
    addProtein: function(amount) {

        if (!this.isSimulation) {
            var Future = Npm.require('fibers/future');
            var future = new Future();
            Meteor.setTimeout(function () {
                future.return();
            }, 3 * 1000);
            future.wait();
        } else {
            amount = 500;
        }

        ProteinData.update({ userId: this.userId }, { $inc: { total: amount } });
        History.insert({
            value: amount,
            date: new Date().toTimeString(),
            userId: this.userId
        });
    }
});

if (Meteor.isClient) {
    Meteor.subscribe('allProteinData');
    Meteor.subscribe('allHistory');
    
    Deps.autorun(function(){
        if(Meteor.user())
            console.log("User logged in: " + Meteor.user().profile.name);
        else
            console.log("User logged out!");
    })


    Template.userDetails.helpers({
        user: function () {
            var data = ProteinData.findOne();
            if(!data) {
                data = {
                    userId: Meteor.userId(),
                    total: 0,
                    goal: 200
                };
                ProteinData.insert(data);
            }
            
            return data;
        },
        lastAmount : function(){ return Session.get('lastAmount');}
    });

    Template.history.helpers({
        historyItem: function () {
            return History.find({}, {sort: { date: -1}});
        }
    });

    Template.userDetails.events({
       'click #addAmount' : function(e) {
           e.preventDefault();

           var amount = parseInt($('#amount').val());
           
           Meteor.call('addProtein', amount, function(error, id){
               if(error)
               return alert(error.reason);
           });
           
           Session.set('lastAmount', amount);
       },
       
        'click #quickSubtract': function(e) {
           e.preventDefault();
           ProteinData.update(this._id, { $inc: { total: -100 } });
       }
    });
}

if (Meteor.isServer) {

    Meteor.publish('allProteinData', function() {
        return ProteinData.find({ userId: this.userId });
    });

    Meteor.publish('allHistory', function () {
        return History.find({ userId: this.userId }, {sort: { date: -1}, limit: 5});
    });

    Meteor.startup(function () {
        
    });
}
