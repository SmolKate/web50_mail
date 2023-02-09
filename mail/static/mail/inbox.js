document.addEventListener('DOMContentLoaded', function() {

    // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archive').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  
  window.onpopstate = function(event) {
    const tag = history.state.mailbox;
    const email = history.state.email;
    if (email) {
      email_content (email);
    }
    if (tag !== 'compose') {
      load_mailbox(tag);
    }  else {
      compose_email();
    } 
    document.querySelector(`#${tag}`).focus();
  }
  // By default, load the inbox
  history.pushState({mailbox:'inbox'}, '', '');
  load_mailbox('inbox');
});

function compose_email() {
  document.querySelectorAll('button').forEach(button => {
    button.onclick = function() {
      history.pushState({mailbox:'compose'}, '', ''); 
    }
  });    
  console.log(history.state);

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  document.querySelector('#compose-error').innerHTML = '';

  // Send email
  
  document.querySelector('#compose-form').onsubmit = () => {
    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: recipients,
          subject: subject,
          body: body,
      })

    })
    .then(response => response.json())
    .then(result => {
        // Print result
        console.log(result);
        if ("error" in result) {
          console.log(result.error);
          document.querySelector('#compose-error').innerHTML = `Error: ${result.error}`;
          
        } else {
        load_mailbox('sent');
        }
    });

    return false;
    
    
  };
}

function load_mailbox(mailbox) {
    
  document.querySelectorAll('button').forEach(button => {
    button.onclick = function() {
      history.pushState({mailbox:`${mailbox}`}, '', ''); 
    }
  });    
  console.log(history.state);
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Show emails
  
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // Print emails
    console.log(emails);

    // Add emails to the list
    emails.forEach(contents => {
      const element = document.createElement('div');
      let first_column;
      element.className = 'add_mail';
      if (mailbox == 'sent') {
        first_column = contents.recipients
      } else {
        first_column = contents.sender 
      };
      element.innerHTML = `
      <div id="heading">
        <div id="mail_sender">
        ${first_column}
        </div> 
        <div id="mail_subject">
        ${contents.subject}
        </div>
      </div>
      <div id="mail_timestamp">
        ${contents.timestamp}
        <button class="btn btn-sm btn-outline-primary" id="archive_button">In archive</button>
        <button class="btn btn-sm btn-outline-primary" id="unarchive_button">Out of archive</button>
      </div>      
      `;
      
      

      // Link to the email content
      element.addEventListener('click', event => {
        const button = event.target.id;
        if (button === 'archive_button') {
          fetch(`/emails/${contents.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              archived: true
            })
          })
          .then (response => load_mailbox('inbox'))
                 
        } else if (button === 'unarchive_button'){
          fetch(`/emails/${contents.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              archived: false
            })
          })
          .then (response => load_mailbox('inbox'))
          
        } else {
          history.pushState({email: contents, mailbox:`${mailbox}`}, '', '');  
          document.querySelector(`#${mailbox}`).focus();
          email_content(contents);
        };
      });
            
      

      // Change the background color for emails
      if (contents.read == true && mailbox !== 'sent') {
        element.style.background = '#e9ecef';
      } else {
        element.style.background = 'white';
      };
      document.querySelector('#emails-view').append(element);

      if (mailbox == 'inbox') {
        document.querySelector('#unarchive_button').remove()
      } else if (mailbox == 'archive'){
        document.querySelector('#archive_button').remove()
      } else {
        document.querySelector('#archive_button').remove();
        document.querySelector('#unarchive_button').remove()
      }
    });
  });

  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('button').forEach(button => {
      button.onclick = function() {
        history.pushState({mailbox:`${mailbox}`}, '', '');           
      }
        
    });
    
  });
  
}

// Print email
function email_content (contents) {
     
  fetch(`/emails/${contents.id}`)
  .then(response => response.json())
  .then(email => {
    console.log(email);
    
    // Show the email and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#email').style.display = 'block';

    //Show the email data
    document.querySelector('#email').innerHTML = `
    <div id="email">
      <div id="email_from">
      <b>From:</b> ${email.sender}
      </div>
      <div id="email_to">
      <b>To:</b> ${email.recipients}
      </div>
      <div id="email_subject">
      <b>Subject:</b> ${email.subject}
      </div>
      <div id="email_timestamp">
      <b>Timestamp:</b> ${email.timestamp}
      </div>
      <button class="btn btn-sm btn-outline-primary" id="button_reply">Replay</button>
      <hr>
      <div>
      <textarea id="view">
      ${email.body}
      </textarea>
      </div>
    </div>`;         

    
    // Change the email status as read
    fetch(`/emails/${contents.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        read: true
      })
    })
    console.log(email.read)

    document.querySelector('#button_reply').onclick = function() {

      // Show compose view and hide other views
      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'block';
      document.querySelector('#email').style.display = 'none';

      // Pre-fill the composition fields
      document.querySelector('#compose-recipients').value = `${email.sender}`;
      if (email.subject.startsWith('Re:') == true) {
        document.querySelector('#compose-subject').value = `${email.subject}`;
      } else {
        document.querySelector('#compose-subject').value = `Re: ${email.subject}`
      };
      document.querySelector('#compose-body').value = `\n\nOn ${email.timestamp} ${email.sender} wrote: \n${email.body}`;
      document.querySelector('#compose-body').focus();
      document.querySelector('#compose-body').setSelectionRange(0, 0);
      
      // Send email  
      document.querySelector('#compose-form').onsubmit = () => {
        const recipients = document.querySelector('#compose-recipients').value;
        const subject = document.querySelector('#compose-subject').value;
        const body = document.querySelector('#compose-body').value;

        fetch('/emails', {
          method: 'POST',
          body: JSON.stringify({
              recipients: recipients,
              subject: subject,
              body: body,
          })

        })
        .then(response => response.json())
        .then(result => {
            // Print result
            console.log(result);
            load_mailbox('sent');
        });

        return false;
      } 
      
    };
  });
}


