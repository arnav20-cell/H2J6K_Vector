from flask import Flask, render_template

# Initialize the Flask application
app = Flask(__name__)

@app.route('/')
def home():
    """
    This function handles requests to the root URL ('/') and
    renders the main HTML page for the web application.
    """
    return render_template('index.html')

if __name__ == '__main__':
    # This block ensures the server runs only when the script is executed directly
    # debug=True will automatically reload the server when you make changes
    app.run(debug=True)