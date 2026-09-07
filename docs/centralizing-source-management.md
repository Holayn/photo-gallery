# Centralizing Source Management

Historically, this app was just built as a viewer of processed photos (aka "sources"). The tool and pipeline to create and manage these sources were designed to be separate.

But really, that pipeline and tool only existed for this app - the processor only ran because this app needs it. It was 2 distinct things when it should really have been just 1 thing. 

This architecture came with several complications:

- Knowing when a source gets updated: had to detect it after the fact by watching every source's index for changes, since nothing told the app directly when processing happened.
- Supporting "recent" photos: would have to query across all sources and merge results in app code.
- Supporting "memories": had to query across all sources. An "index" was built to save on querying. In hindsight, it might have been better to just query.
- Supporting "explore": had to query across all sources and perform complicated logic to support randomly jumping between sources and their photos.

These complications, plus the fact that they're really 1 thing, drove the changes to centralize source management, making this a more cohesive, "1 product" app.

The app will keep using the tool to process photos, since there are clear wins for keeping the processor its own tool and in its own process:
- Running the processor in the same process as the app will impact app performance.
- It keeps the processor de-coupled from this app and thus re-usable, which were part of the original goals of keeping the 2 things distinct.

The app will now use its `file` table to maintain an index to all sources. Previously, this was lazily populated as needed, but the move to use this as an index makes things much simpler.

It is expected now that only the app triggers source processing - the app will not be notified of any processing triggered externally (unless manually re-synced).

The app will now support selectively watching source files to trigger source processing when appropriate. Since only some sources are continuously updated, this is opt-in (to avoid unnecessary work) - configured per source in the app.