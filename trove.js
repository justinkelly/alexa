import requests  
import random
 
def lambda_handler(event, context):
    """ Route the incoming request based on type (LaunchRequest, IntentRequest,
    etc.) The JSON body of the request is provided in the event parameter.
    """
    print("event.session.application.applicationId=" +
          event['session']['application']['applicationId'])
 
    """
    Uncomment this if statement and populate with your skill's application ID to
    prevent someone else from configuring a skill that sends requests to this
    function.
    """
    # if (event['session']['application']['applicationId'] !=
    #         "amzn1.echo-sdk-ams.app.[unique-value-here]"):
    #     raise ValueError("Invalid Application ID")
 
    if event['session']['new']:
        on_session_started({'requestId': event['request']['requestId']},
                           event['session'])
 
    if event['request']['type'] == "LaunchRequest":
        return on_launch(event['request'], event['session'])
    elif event['request']['type'] == "IntentRequest":
        return on_intent(event['request'], event['session'])
    elif event['request']['type'] == "SessionEndedRequest":
        return on_session_ended(event['request'], event['session'])
 
 
def on_session_started(session_started_request, session):
    """ Called when the session starts """
 
    print("on_session_started requestId=" + session_started_request['requestId']
          + ", sessionId=" + session['sessionId'])
 
 
def on_launch(launch_request, session):
    """ Called when the user launches the skill without specifying what they
    want
    """
 
    print("on_launch requestId=" + launch_request['requestId'] +
          ", sessionId=" + session['sessionId'])
    # Dispatch to your skill's launch
    return get_welcome_response()
 
 
def on_intent(intent_request, session):
    """ Called when the user specifies an intent for this skill """
 
    print("on_intent requestId=" + intent_request['requestId'] +
          ", sessionId=" + session['sessionId'])
 
    intent = intent_request['intent']
    intent_name = intent_request['intent']['name']
 
    # Dispatch to your skill's intent handlers
    if intent_name == "queryTrove":
        return get_trove_query(intent, session)
    elif intent_name == "AMAZON.HelpIntent":
        return get_welcome_response()
    else:
        raise ValueError("Invalid intent")
 
 
def on_session_ended(session_ended_request, session):
    """ Called when the user ends the session.
 
    Is not called when the skill returns should_end_session=true
    """
    print("on_session_ended requestId=" + session_ended_request['requestId'] +
          ", sessionId=" + session['sessionId'])
    # add cleanup logic here
 
# --------------- Functions that control the skill's behavior ------------------
 
 
def get_welcome_response():
    """ If we wanted to initialize the session to have some attributes we could
    add those here
    """
 
    session_attributes = {}
    card_title = "Welcome"
    speech_output = "Welcome to the Alexa Bus Tracker Application. " \
                    "Please ask me for bus times by saying, " \
                    "What are my bus times?"
    # If the user either does not reply to the welcome message or says something
    # that is not understood, they will be prompted again with this text.
    reprompt_text = "Please ask me for bus times by saying, " \
                    "What are my bus times?"
    should_end_session = False
    return build_response(session_attributes, build_speechlet_response(
        card_title, speech_output, reprompt_text, should_end_session))
 
 
def get_trove_query(intent, session):

    card_title = intent['name']
    session_attributes = {}
    should_end_session = True
 


    word_site = "https://raw.githubusercontent.com/paritytech/wordlist/master/res/wordlist.txt"

    response = requests.get(word_site)
    WORDS = response.content.splitlines()
    searchquery = random.choice(WORDS)

    
    apikey='f2shgp97vv0ab8os'
    troveURL = 'http://api.trove.nla.gov.au/'

    r = requests.get(troveURL + 'result/', params = { 
        'key': apikey, 
        'zone': 'book', 
        'encoding': 'json',
        'q': searchquery
    } )
 
    r.encoding = 'ISO-8859-1' # We avoid some unicode conversion errors by adding this step.
    results=r.json() 

    trove_book_title = results['response']['zone'][0]['records']['work'][0]['title']

    final_data = "For the random word" + searchquery + " Trove has found the book " + trove_book_title
 
    if final_data and not final_data.isspace():
        speech_output = final_data
        reprompt_text = ""
    else:
        speech_output = "Please ask me for Trove random book by saying, " \
                        "Trove seach random"
        reprompt_text = "Please ask me for Trove random book by saying, " \
                        "Trove search random"
    return build_response(session_attributes, build_speechlet_response(
        card_title, speech_output, reprompt_text, should_end_session))
 



 
# --------------- Helpers that build all of the responses ----------------------
 
 
def build_speechlet_response(title, output, reprompt_text, should_end_session):
    return {
        'outputSpeech': {
            'type': 'PlainText',
            'text': output
        },
        'card': {
            'type': 'Simple',
            'title': 'SessionSpeechlet - ' + title,
            'content': 'SessionSpeechlet - ' + output
        },
        'reprompt': {
            'outputSpeech': {
                'type': 'PlainText',
                'text': reprompt_text
            }
        },
        'shouldEndSession': should_end_session
    }
 
 
def build_response(session_attributes, speechlet_response):
    return {
        'version': '1.0',
        'sessionAttributes': session_attributes,
        'response': speechlet_response
    }
