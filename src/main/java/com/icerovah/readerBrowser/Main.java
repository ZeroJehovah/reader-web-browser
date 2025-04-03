package com.icerovah.readerBrowser;

import com.icerovah.readerBrowser.application.ReaderWebBrowser;
import com.icerovah.readerBrowser.config.Config;

import java.io.IOException;

public class Main extends ReaderWebBrowser {

    public static void main(String[] args) throws IOException {
        Config.read();
        launch(args);
    }

}